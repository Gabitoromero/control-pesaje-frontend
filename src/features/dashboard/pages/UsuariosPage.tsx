import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getUsuarios, createUsuario, updateUsuario, deleteUsuario, type Usuario, type UsuarioCreate } from '../../../api/usuarios';
import { UsuarioRol } from '../../../shared/types';
import { Plus, Edit, Trash, X } from 'lucide-react';

const ROL_LABELS: Record<string, string> = {
  [UsuarioRol.ADMINISTRADOR]: 'Administrador',
  [UsuarioRol.JEFE]: 'Jefe',
  [UsuarioRol.OPERARIO]: 'Operario',
  [UsuarioRol.VISUALIZACION]: 'Visualización',
};

const EMPTY_FORM = {
  legajo: '',
  nombreUsuario: '',
  rol: UsuarioRol.OPERARIO as string,
  contrasena: '',
  pin: '',
};

export const UsuariosPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUsuario, setEditingUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: usuarios, isLoading, error } = useQuery({
    queryKey: ['usuarios'],
    queryFn: getUsuarios,
  });

  const createMutation = useMutation({
    mutationFn: createUsuario,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); closeModal(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<UsuarioCreate> }) => updateUsuario(id, data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['usuarios'] }); closeModal(); },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUsuario,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['usuarios'] }),
  });

  const openModal = (usuario?: Usuario) => {
    if (usuario) {
      setEditingUsuario(usuario);
      setFormData({
        legajo: usuario.legajo || '',
        nombreUsuario: usuario.nombreUsuario,
        rol: usuario.rol,
        contrasena: '',
        pin: usuario.datosAdicionales?.pin ?? '',
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
  };

  const handleSubmit = (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    const isOperario = formData.rol === UsuarioRol.OPERARIO;

    const payload: UsuarioCreate = {
      legajo: formData.legajo,
      nombreUsuario: formData.nombreUsuario,
      rol: formData.rol as typeof UsuarioRol[keyof typeof UsuarioRol],
      ...(isOperario
        ? { datosAdicionales: { pin: formData.pin } }
        : formData.contrasena ? { contrasena: formData.contrasena } : {}),
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

  const isOperario = formData.rol === UsuarioRol.OPERARIO;
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
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {usuarios?.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.legajo || '-'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{u.nombreUsuario}</td>
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
            {usuarios?.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">No hay usuarios registrados.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{editingUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700"><X size={20} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
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

                {isOperario ? (
                  <div>
                    <label htmlFor="pin" className="block text-sm font-medium text-gray-700">PIN (4–6 dígitos)</label>
                    <input
                      id="pin"
                      type="text"
                      inputMode="numeric"
                      pattern="\d{4,6}"
                      maxLength={6}
                      required={!editingUsuario}
                      placeholder={editingUsuario ? 'Dejar vacío para no cambiar' : ''}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.pin}
                      onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor="contrasena" className="block text-sm font-medium text-gray-700">Contraseña</label>
                    <input
                      id="contrasena"
                      type="password"
                      required={!editingUsuario}
                      placeholder={editingUsuario ? 'Dejar vacío para no cambiar' : ''}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={formData.contrasena}
                      onChange={(e) => setFormData({ ...formData, contrasena: e.target.value })}
                    />
                  </div>
                )}
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

