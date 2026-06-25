import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRuta, createRuta, updateRuta, deleteRuta } from '../../../api/rutas';
import { getEtapas } from '../../../api/etapas';
import { Plus, Trash, ArrowUp, ArrowDown, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { isAxiosError } from 'axios';
import { rutaSchema } from './RutaFormPage.schemas.js';

type RutaFormValues = z.infer<typeof rutaSchema>;

export const RutaFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isEditing = Boolean(id);

  const { data: etapasOptions = [] } = useQuery({ queryKey: ['etapas'], queryFn: getEtapas });

  const { data: ruta, isLoading: loadingRuta } = useQuery({
    queryKey: ['ruta', id],
    queryFn: () => getRuta(Number(id)),
    enabled: isEditing,
  });

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RutaFormValues>({
    resolver: zodResolver(rutaSchema) as unknown as Resolver<RutaFormValues>,
    defaultValues: {
      nombre: '',
      descripcion: '',
      etapas: [
        {
          etapa: 0,
          pesoMinimo: 0,
          pesoMaximo: 0,
          pesoIdeal: 0,
          cantidadMuestrasRequeridas: 1,
        }
      ],
    },
  });

  const { fields, append, remove, swap } = useFieldArray({
    control,
    name: 'etapas',
  });

  useEffect(() => {
    if (ruta) {
      reset({
        nombre: ruta.nombre,
        descripcion: ruta.descripcion || '',
        etapas: [...(ruta.etapas ?? [])].sort((a, b) => a.orden - b.orden).map(e => ({
          id: e.id,
          etapa: e.etapa.id,
          pesoMinimo: e.pesoMinimo,
          pesoMaximo: e.pesoMaximo,
          pesoIdeal: e.pesoIdeal,
          cantidadMuestrasRequeridas: e.cantidadMuestrasRequeridas,
        })),
      });
    }
  }, [ruta, reset]);

  const createMutation = useMutation({
    mutationFn: createRuta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      navigate('/dashboard/rutas');
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo guardar:\n${msg}`);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateRuta>[1] }) => updateRuta(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      navigate('/dashboard/rutas');
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo guardar:\n${msg}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteRuta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['rutas-inactivos'] });
      navigate('/dashboard/rutas');
    },
    onError: (err: unknown) => {
      let msg = 'Ocurrió un error inesperado';
      if (isAxiosError(err)) {
        msg = err.response?.data?.error?.message || err.message;
      } else if (err instanceof Error) {
        msg = err.message;
      }
      alert(`No se pudo eliminar la ruta:\n${msg}\n\nNota de sistema: No podés eliminar entidades que ya están asociadas a Líneas en el sistema.`);
    },
  });

  const handleDelete = () => {
    if (window.confirm('¿Está seguro de eliminar esta ruta?')) {
      deleteMutation.mutate(Number(id));
    }
  };

  const handleReactivar = () => {
    if (window.confirm('¿Está seguro de reactivar esta ruta?')) {
      updateMutation.mutate({ id: Number(id), data: { activo: true } });
    }
  };

  const onSubmit = (data: RutaFormValues) => {
    const etapas = data.etapas.map((e, index) => ({
      ...(e.id != null ? { id: e.id } : {}),
      etapa: e.etapa,
      orden: index + 1,
      pesoMinimo: e.pesoMinimo,
      pesoIdeal: e.pesoIdeal,
      pesoMaximo: e.pesoMaximo,
      cantidadMuestrasRequeridas: e.cantidadMuestrasRequeridas,
    }));

    const payload = {
      nombre: data.nombre,
      descripcion: data.descripcion?.trim() || null,
      etapas,
    };

    if (isEditing) {
      updateMutation.mutate({ id: Number(id), data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingRuta) return <div className="p-6">Cargando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/rutas')}
          className="text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditing ? 'Editar Ruta' : 'Nueva Ruta'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Información General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <input
                {...register('nombre')}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              {errors.nombre && <span className="text-red-500 text-sm">{errors.nombre.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Descripción (opcional)</label>
              <textarea
                {...register('descripcion')}
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Etapas de la Ruta</h2>
            <button
              type="button"
              onClick={() => append({
                etapa: 0,
                pesoMinimo: 0,
                pesoMaximo: 0,
                pesoIdeal: 0,
                cantidadMuestrasRequeridas: 1,
              })}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Agregar Etapa
            </button>
          </div>
          
          {errors.etapas?.message && (
            <div className="text-red-500 text-sm mb-4">{errors.etapas.message}</div>
          )}

          <div className="space-y-4">
            {fields.map((field: { id: string }, index: number) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 flex items-start gap-4">
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    type="button"
                    title="Subir etapa"
                    aria-label="Subir etapa"
                    onClick={() => index > 0 && swap(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    title="Bajar etapa"
                    aria-label="Bajar etapa"
                    onClick={() => index < fields.length - 1 && swap(index, index + 1)}
                    disabled={index === fields.length - 1}
                    className="p-1 text-gray-400 hover:text-blue-600 disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">


                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Etapa</label>
                    <select
                      {...register(`etapas.${index}.etapa`)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
                    >
                      <option value={0}>Seleccione...</option>
                      {etapasOptions.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>
                    {errors.etapas?.[index]?.etapa && (
                      <span className="text-red-500 text-xs">{errors.etapas[index]?.etapa?.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Muestras Requeridas</label>
                    <input
                      type="number"
                      {...register(`etapas.${index}.cantidadMuestrasRequeridas`)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Peso Mínimo</label>
                    <input
                      type="number"
                      step="0.001"
                      {...register(`etapas.${index}.pesoMinimo`)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Peso Ideal</label>
                    <input
                      type="number"
                      step="0.001"
                      {...register(`etapas.${index}.pesoIdeal`)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Peso Máximo</label>
                    <input
                      type="number"
                      step="0.001"
                      {...register(`etapas.${index}.pesoMaximo`)}
                      className="block w-full rounded-md border border-gray-300 px-3 py-1.5 shadow-sm text-sm"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  title="Eliminar etapa"
                  aria-label="Eliminar etapa"
                  onClick={() => {
                    if (fields.length === 1) {
                      if (window.confirm("¿Esta seguro que desea eliminar la ultima etapa? \nNo se podra asignar una ruta sin etapas a una linea de produccion")) {
                        remove(index);
                      }
                    } else {
                      remove(index);
                    }
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 mt-5"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {isEditing && ruta?.activo !== false && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash size={18} /> Eliminar Ruta
              </button>
            )}
            {isEditing && ruta?.activo === false && (
              <button
                type="button"
                onClick={handleReactivar}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-green-600 border border-green-200 rounded-md hover:bg-green-50 disabled:opacity-50 flex items-center gap-2 mr-auto"
              >
                <RefreshCw size={18} /> Reactivar Ruta
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/rutas')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} /> {isBusy ? 'Guardando...' : 'Guardar Ruta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
