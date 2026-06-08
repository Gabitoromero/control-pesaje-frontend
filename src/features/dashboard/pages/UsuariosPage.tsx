import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getUsuarios,
  getUsuariosInactivos,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  type Usuario,
  type UsuarioCreate,
} from '../../../api/usuarios';
import { UsuarioRol } from '../../../shared/types';
import { Plus, Edit, Trash, X, Eye, EyeOff } from 'lucide-react';

const ROL_LABELS: Record<string, string> = {
  [UsuarioRol.ADMINISTRADOR]: 'Administrador',
  [UsuarioRol.JEFE]: 'Jefe',
  [UsuarioRol.OPERARIO]: 'Operario',
  [UsuarioRol.VISUALIZACION]: 'Visualización',
};

const EMPTY_FORM = {
  legajo: '',
  nombreApellido: '',
  nombreUsuario: '',
  rol: UsuarioRol.OPERARIO as string,
  contrasena: '',
  pin: '',
  puedeTomarMuestrasLibres: false,
};

export const UsuariosPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  const { data: activos = [], isLoading: loadingActivos, error: errorActivos } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios,
  });

  const { data: inactivos = [], isLoading: loadingInactivos, error: errorInactivos } = useQuery({
    queryKey: ['usuarios-inactivos'],
    queryFn: getUsuariosInactivos,
  });

  const isLoading = loadingActivos || loadingInactivos;
  const error = errorActivos || errorInactivos;
  const usuarios = [...activos, ...inactivos];

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-inactivos'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UsuarioCreate> }) => updateUsuario(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-inactivos'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usuarios'] });
      queryClient.invalidateQueries({ queryKey: ['usuarios-inactivos'] });
    },
  });

  const openModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        legajo: usuario.legajo || '',
        nombreApellido: usuario.nombreApellido || '',
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol,
        contrasena: '',
        pin: usuario.pin ?? '',
        puedeTomarMuestrasLibres: usuario.puedeTomarMuestrasLibres ?? false,
      });
    } else {
      setEditingUsuario(null);
      setFormData(EMPTY_FORM);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUsuario(null);
    setFormData(EMPTY_FORM);
    setShowPassword(false);
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();

    const payload: UsuarioCreate = {
      legajo: formData.legajo,
      nombreApellido: formData.nombreApellido,
      nombreUsuario: formData.nombreUsuario,
      rol: formData.rol as typeof UsuarioRol[keyof typeof UsuarioRol],
      puedeTomarMuestrasLibres: formData.puedeTomarMuestrasLibres,
      ...(formData.contrasena ? { contrasena: formData.contrasena } : {}),
      ...(formData.pin ? { pin: formData.pin } : {}),
    };

    if (editingUsuario?.id) {
      updateMutation.mutate({ id: editingUsuario.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('¿Está seguro de eliminar este usuario?')) {
      deleteMutation.mutate(id);
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isLoading) return <div className="p-6">Cargando usuarios...</div>;
  if (error) return <div className="p-6 text-red-500">Error al cargar usuarios</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Gestión de Usuarios</h1>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
        >
          <Plus size={18} /> Nuevo Usuario
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Legajo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nombre</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios.map((u) => (
              <tr key={u.id} className={`hover:bg-gray-50 ${u.activo === false ? 'opacity-60' : ''}`}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.legajo || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.nombreApellido || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.nombreUsuario}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ROL_LABELS[u.rol] ?? u.rol}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${u.activo !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                    {u.activo !== false ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button onClick={() => openModal(u)} className="text-indigo-600 hover:text-indigo-900 mr-4" title="Editar">
                    <Edit size={18} />
                  </button>
                  <button onClick={() => u.id && handleDelete(u.id)} className="text-red-600 hover:text-red-900" title="Eliminar">
                    <Trash size={18} />
                  </button>
                </td>
              </tr>
            ))}
            {usuarios.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label htmlFor="legajo" className="block text-sm font-medium text-gray-700">Legajo</label>
                  <input
                    id="legajo"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.legajo}
                    onChange={(e) => setFormData({ ...formData, legajo: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="nombreApellido" className="block text-sm font-medium text-gray-700">Nombre completo</label>
                  <input
                    id="nombreApellido"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.nombreApellido}
                    onChange={(e) => setFormData({ ...formData, nombreApellido: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="nombreUsuario" className="block text-sm font-medium text-gray-700">Nombre de usuario</label>
                  <input
                    id="nombreUsuario"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.nombreUsuario}
                    onChange={(e) => setFormData({ ...formData, nombreUsuario: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="rol" className="block text-sm font-medium text-gray-700">Rol</label>
                  <select
                    id="rol"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.rol}
                    onChange={(e) => setFormData({ ...formData, rol: e.target.value, contrasena: '', pin: '' })}
                  >
                    {Object.entries(ROL_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="pin" className="block text-sm font-medium text-gray-700">PIN (4–6 dígitos)</label>
                  <input
                    id="pin"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4,6}"
                    maxLength={6}
                    placeholder={editingUsuario ? 'Dejar vacío para no cambiar' : ''}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                  />
                </div>

                <div>
                  <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">Contraseña</label>
                  <div className="relative mt-1">
                    <input
                      id="contrasena"
                      type={showPassword ? 'text' : 'password'}
                      minLength={4}
                      required={!editingUsuario}
                      placeholder={editingUsuario ? 'Dejar vacío para no cambiar' : ''}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.contrasena}
                      onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                      tabIndex={-1}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="sm:col-span-2 flex items-center gap-3 pt-1">
                  <input
                    id="puedeTomarMuestrasLibres"
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={formData.puedeTomarMuestrasLibres}
                    onChange={(e) => setFormData({ ...formData, puedeTomarMuestrasLibres: e.target.checked })}
                  />
                  <label htmlFor="puedeTomarMuestrasLibres" className="text-sm font-medium text-gray-700">
                    Puede tomar muestras libres
                  </label>
                </div>

              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isBusy} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50">
                  {isBusy ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
