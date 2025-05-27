import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { MoreVertical } from "lucide-react";
import NewProjectModal from "@/components/modals/NewProjectModal";
import LoginAlertModal from "@/components/modals/LoginAlertModal";
import { useProjectStore } from "@/store/projectStore";
import { useCanvasStore } from "@/store/canvasStore";

export default function LeftPanel() {
  const user = auth.currentUser;
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const menuRef = useRef(null);

  const nodes = useCanvasStore((state) => state.nodes);
  const projectId = useProjectStore((state) => state.projectId);
  const setProjectId = useProjectStore((state) => state.setProjectId);

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const q = query(collection(db, "projects"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProjects(data);
    };
    fetchProjects();
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateProject = async (name) => {
    if (!user || !name) return;
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name,
        uid: user.uid,
        createdAt: serverTimestamp(),
        nodes: nodes,
      });
      setProjects((prev) => [...prev, { id: docRef.id, name, nodes }]);
      setProjectId(docRef.id);
    } catch (e) {
      console.error("Error creando proyecto:", e);
    }
    setShowModal(false);
  };

  const handleUpdateProject = async (name) => {
    if (!editProject || !name) return;
    const ref = doc(db, "projects", editProject.id);
    await updateDoc(ref, { name });
    setProjects((prev) =>
      prev.map((p) => (p.id === editProject.id ? { ...p, name } : p))
    );
    setEditProject(null);
  };

  const handleDeleteProject = async (id) => {
    if (!confirm("¿Eliminar este proyecto?")) return;
    await deleteDoc(doc(db, "projects", id));
    setProjects((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 space-y-4 shrink-0">
        <div
          onClick={() => setProjectId(null)}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <img src="/logo.svg" className="w-8 h-8" alt="Logo Minds Tornado" />
          <span className="text-lg font-bold text-gray-800">Minds Tornado</span>
        </div>
        {user && (
          <div className="flex items-center gap-3">
            <img
              src={user.photoURL || "/fallback-avatar.png"}
              alt={user.displayName}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="text-sm text-gray-700">{user.displayName}</div>
          </div>
        )}
      </div>

      {/* Proyectos */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h2 className="text-sm font-semibold text-gray-600">Tus proyectos</h2>
        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={project.id}
              onClick={() => {
                if (!user) {
                  setShowLoginModal(true);
                  return;
                }
                setProjectId(project.id);
              }}
              className={`relative group px-3 py-2 rounded-lg cursor-pointer text-sm flex justify-between items-center ${
                projectId === project.id
                  ? "bg-blue-100 font-semibold text-blue-800"
                  : "hover:bg-blue-50 text-gray-700"
              }`}
            >
              <span>{project.name || "Sin nombre"}</span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <a
                  role="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(project.id);
                  }}
                  className="cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4 text-red-500" />
                </a>
              </div>

              {menuOpenId === project.id && (
                <div
                  ref={menuRef}
                  className="fixed bg-white border border-gray-200 rounded shadow z-50 text-sm w-32"
                  style={{
                    top: `${window.event?.clientY || 0}px`,
                    left: `${window.event?.clientX - 150 || 0}px`,
                  }}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditProject(project);
                      setMenuOpenId(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100"
                  >
                    Renombrar Proyecto
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600"
                  >
                    Borrar Proyecto
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      {/* Botones */}
      <div className="p-4 border-t border-gray-200 shrink-0 space-y-2">
        {user && !projectId && nodes.length > 0 && (
          <button
            onClick={() => setShowModal(true)}
            className="w-full bg-green-600 text-white py-2 rounded-lg shadow hover:bg-green-700 transition"
          >
            Guardar este trabajo
          </button>
        )}
        <button
          onClick={() => {
            if (!user) {
              setShowLoginModal(true);
              return;
            }
            setShowModal(true);
          }}
          className="w-full bg-blue-600 text-white py-2 rounded-lg shadow hover:bg-blue-700 transition"
        >
          + Nuevo proyecto
        </button>
      </div>

      {/* Modals */}
      <LoginAlertModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <NewProjectModal
        open={!!showModal && !editProject}
        onClose={() => setShowModal(false)}
        onCreate={handleCreateProject}
      />
      <NewProjectModal
        open={!!editProject}
        onClose={() => {
          setEditProject(null);
          setShowModal(false);
        }}
        onCreate={handleUpdateProject}
        defaultValue={editProject?.name}
      />
    </div>
  );
}
