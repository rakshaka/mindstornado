import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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
import UnsavedChangesModal from "@/components/modals/UnsavedChangesModal";
import { useSelectionStore } from "@/store/selectionStore";
import { resetCanvas } from "@/utils/resetCanvas";

export default function LeftPanel() {
  const user = auth.currentUser;
  const [projects, setProjects] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [editProject, setEditProject] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const menuRef = useRef(null);
  const navigate = useNavigate(); 

  const nodes = useCanvasStore((state) => state.nodes);
  const setNodes = useCanvasStore((state) => state.setNodes);
  const projectId = useProjectStore((state) => state.projectId);
  const setProjectId = useProjectStore((state) => state.setProjectId);
  const setSelectedNode = useSelectionStore((state) => state.setSelectedNode);

  const resetAndContinue = (action) => {
    resetCanvas();     // limpia canvas, projectId, selección
    action();          // ejecuta lo que el usuario quería hacer
  };
  

  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const q = query(collection(db, "projects"), where("uid", "==", user.uid));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
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

  const saveCurrentCanvas = async () => {
    if (!user) return;
  
    const name = prompt("Nombre del proyecto actual:");
    if (!name) return;
  
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name,
        uid: user.uid,
        createdAt: serverTimestamp(),
        nodes,
      });
      setProjects((prev) => [...prev, { id: docRef.id, name, nodes }]);
      setProjectId(docRef.id);        // 🔐 MARCA COMO GUARDADO
    } catch (e) {
      console.error("Error al guardar:", e);
    }
  };  
  

  const handleCreateProject = async (name) => {
    if (!user || !name) return;
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name,
        uid: user.uid,
        createdAt: serverTimestamp(),
        nodes: [],
      });
      setProjects((prev) => [...prev, { id: docRef.id, name, nodes: [] }]);
      setProjectId(docRef.id);
      resetCanvas(); 
    } catch (e) {
      console.error("Error creando proyecto:", e);
    }
    setShowModal(false);
  };  

  const handleSaveAsNewProject = async (name) => {
    if (!user || !name) return;
    try {
      const docRef = await addDoc(collection(db, "projects"), {
        name,
        uid: user.uid,
        createdAt: serverTimestamp(),
        nodes, // 🔐 Guarda lo actual
      });
      setProjects((prev) => [...prev, { id: docRef.id, name, nodes }]);
      setProjectId(docRef.id);
    } catch (e) {
      console.error("Error al guardar como nuevo proyecto:", e);
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

  const confirmLeave = (action) => {
    if (!projectId && nodes.length > 0) {
      setPendingAction(() => () => resetAndContinue(action));
      setShowUnsavedModal(true);
    } else {
      action();
    }
  };
  
  

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-gray-200 space-y-4 shrink-0">
        <div
          onClick={() =>
            confirmLeave(() => {
              resetCanvas();
              setTimeout(() => window.location.reload(), 50);
            })
          }               
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
              className="w-7 h-7 rounded-full object-cover"
            />
            <div className="text-xs text-gray-700">{user.displayName}</div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <h2 className="text-xs font-semibold text-purple-800">Tus proyectos</h2>
        <ul className="space-y-2">
          {projects.map((project) => (
            <li
              key={project.id}
              onClick={() => confirmLeave(() => setProjectId(project.id))}
              className={`relative group px-3 py-2 rounded-lg cursor-pointer text-xs flex justify-between items-center ${
                projectId === project.id
                  ? "bg-purple-50 font-semibold text-purple-800"
                  : "hover:bg-purple-50 text-gray-700"
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
                  <MoreVertical className="w-4 h-4 text-purple-500" />
                </a>
              </div>
              {menuOpenId === project.id && (
                <div
                  ref={menuRef}
                  className="fixed bg-white border-gray-500 rounded shadow z-50 text-xs"
                  style={{
                    top: `${window.event?.clientY || 0}px`,
                    left: `${window.event?.clientX - 150 || 0}px`,
                  }}
                >
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditProject(project);
                      setMenuOpenId(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-xs"
                  >
                    Renombrar Proyecto
                  </div>
                  <div
                    role="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProject(project.id);
                      setMenuOpenId(null);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-100 text-red-600 text-xs"
                  >
                    Borrar Proyecto
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="p-4 border-t border-gray-200 shrink-0 space-y-2">
        {user && !projectId && nodes.length > 0 && (
          <button
            onClick={() => {
              setEditProject(null); // Asegura que no está renombrando
              setShowModal(true);
            }}
            className="w-full bg-purple-600 text-white py-2 rounded-lg shadow hover:bg-green-700 text-sm transition"
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
          className="w-full bg-purple-800 text-white py-2 rounded-lg shadow hover:bg-purple-500 text-sm transition"
        >
          + Nuevo proyecto
        </button>
      </div>

      <LoginAlertModal open={showLoginModal} onClose={() => setShowLoginModal(false)} />
      <NewProjectModal
        open={!!showModal && !editProject}
        onClose={() => setShowModal(false)}
        onCreate={projectId ? handleCreateProject : handleSaveAsNewProject}
      />
      <UnsavedChangesModal
        open={showUnsavedModal}
        onCancel={() => {
          setPendingAction(null);
          setShowUnsavedModal(false);
        }}
        onDiscard={() => {
          setShowUnsavedModal(false);
          if (pendingAction) pendingAction(); // ahora sí limpia y ejecuta
        }}
        onSave={async () => {
          await saveCurrentCanvas();          // guarda proyecto
          resetCanvas();                      // limpia todo
          setShowUnsavedModal(false);
          if (pendingAction) pendingAction(); // ejecuta acción original
        }}                     
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