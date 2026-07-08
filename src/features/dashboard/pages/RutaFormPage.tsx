import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRuta, createRuta, updateRuta, deleteRuta } from '../../../api/rutas';
import { getEtapas } from '../../../api/etapas';
import { getArticulos } from '../../../api/articulos';
import { getArticulosDeRuta, addArticuloARuta, removeArticuloDeRuta } from '../../../api/articulos-ruta';
import type { ArticuloRutaPasadaItem } from '../../../shared/types/domain';
import { Plus, Trash, ArrowUp, ArrowDown, ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { rutaSchema } from './RutaFormPage.schemas.js';
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';

type RutaFormValues = z.infer<typeof rutaSchema>;

export const RutaFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, alertError } = useDialog();
  const isEditing = Boolean(id);

  const { data: etapasOptions = [] } = useQuery({ queryKey: ['etapas'], queryFn: getEtapas });
  const { data: articulosOptions = [] } = useQuery({ queryKey: ['articulos'], queryFn: getArticulos });

  // Articulos asignados a la ruta (pivot table, managed via direct API calls)
  const { data: articulosAsignados = [], refetch: refetchArticulosAsignados } = useQuery({
    queryKey: ['ruta-articulos', id],
    queryFn: () => getArticulosDeRuta(Number(id)),
    enabled: isEditing,
  });

  // Local state for articulos in create mode (not yet persisted until the ruta itself is saved)
  const [articulosLocal, setArticulosLocal] = useState<ArticuloRutaPasadaItem[]>([]);
  const [selectedArticuloId, setSelectedArticuloId] = useState<number>(0);

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
      toast.success('Ruta creada exitosamente');
      navigate('/dashboard/rutas');
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo guardar',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof updateRuta>[1]; accion: 'actualizada' | 'reactivada' }) => updateRuta(id, data),
    onSuccess: (_result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      toast.success(
        variables.accion === 'reactivada'
          ? 'Ruta reactivada exitosamente'
          : 'Ruta actualizada exitosamente'
      );
      navigate('/dashboard/rutas');
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo guardar',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const addArticuloMutation = useMutation({
    mutationFn: ({ rutaId, articuloId }: { rutaId: number; articuloId: number }) =>
      addArticuloARuta(rutaId, articuloId),
    onSuccess: () => {
      refetchArticulosAsignados();
      setSelectedArticuloId(0);
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo agregar el artículo',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const removeArticuloMutation = useMutation({
    mutationFn: (pivotId: number) => removeArticuloDeRuta(pivotId),
    onSuccess: () => {
      refetchArticulosAsignados();
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo eliminar el artículo',
        description: getApiErrorMessage(err, 'Ocurrió un error inesperado'),
      });
    },
  });

  const handleAddArticulo = () => {
    if (!selectedArticuloId || selectedArticuloId === 0) return;

    if (isEditing) {
      // In edit mode: call the API directly
      addArticuloMutation.mutate({ rutaId: Number(id), articuloId: selectedArticuloId });
    } else {
      // In create mode: manage locally until the ruta is persisted
      const alreadyAssigned = articulosLocal.some(a => a.articulo.id === selectedArticuloId);
      if (alreadyAssigned) return;

      const articuloOption = articulosOptions.find(a => a.id === selectedArticuloId);
      if (!articuloOption) return;

      const localItem: ArticuloRutaPasadaItem = {
        id: -(Date.now()), // temporary negative ID for local items
        articulo: {
          id: articuloOption.id!,
          nombre: articuloOption.nombre,
          marca: articuloOption.marca,
        },
      };
      setArticulosLocal(prev => [...prev, localItem]);
      setSelectedArticuloId(0);
    }
  };

  const handleRemoveArticulo = (pivotId: number) => {
    if (isEditing) {
      removeArticuloMutation.mutate(pivotId);
    } else {
      setArticulosLocal(prev => prev.filter(a => a.id !== pivotId));
    }
  };

  // Compute displayed list: server data in edit mode, local state in create mode
  const articulosMostrados = isEditing ? articulosAsignados : articulosLocal;

  // IDs of articulos already assigned — used to exclude them from the selector
  const articulosAsignadosIds = new Set(articulosMostrados.map(a => a.articulo.id));

  const deleteMutation = useMutation({
    mutationFn: deleteRuta,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rutas'] });
      queryClient.invalidateQueries({ queryKey: ['rutas-inactivos'] });
      toast.success('Ruta eliminada exitosamente');
      navigate('/dashboard/rutas');
    },
    onError: (err: unknown) => {
      alertError({
        title: 'No se pudo eliminar la ruta',
        description: `${getApiErrorMessage(err, 'Ocurrió un error inesperado')}\n\nNota de sistema: No podés eliminar entidades que ya están asociadas a Líneas en el sistema.`,
      });
    },
  });

  const handleDelete = async () => {
    const confirmed = await confirm({
      title: '¿Está seguro de eliminar esta ruta?',
      confirmText: 'Eliminar',
      cancelText: 'Cancelar',
      variant: 'destructive',
    });
    if (confirmed) {
      deleteMutation.mutate(Number(id));
    }
  };

  const handleReactivar = async () => {
    const confirmed = await confirm({
      title: '¿Está seguro de reactivar esta ruta?',
    });
    if (confirmed) {
      updateMutation.mutate({ id: Number(id), data: { activo: true }, accion: 'reactivada' });
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
      updateMutation.mutate({ id: Number(id), data: payload, accion: 'actualizada' });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  if (isEditing && loadingRuta) return <div className="p-6 text-foreground">Cargando...</div>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/rutas')}
          className="text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold text-foreground">
          {isEditing ? 'Editar Ruta' : 'Nueva Ruta'}
        </h1>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-card border border-border rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4 text-foreground">Información General</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground">Nombre</label>
              <input
                {...register('nombre')}
                className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
              {errors.nombre && <span className="text-destructive text-sm">{errors.nombre.message}</span>}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Descripción <span className="text-muted-foreground font-normal">(opcional)</span></label>
              <textarea
                {...register('descripcion')}
                rows={3}
                className="mt-1 block w-full rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground"
              />
            </div>
          </div>
        </div>

        <CollapsibleSection
          title="Etapas de la Ruta"
          count={fields.length}
          forceOpen={!!errors.etapas}
        >
          {errors.etapas?.message && (
            <div className="text-destructive text-sm mb-4">{errors.etapas.message}</div>
          )}

          <div className="flex justify-end mb-4">
            <button
              type="button"
              onClick={() => append({
                etapa: 0,
                pesoMinimo: 0,
                pesoMaximo: 0,
                pesoIdeal: 0,
                cantidadMuestrasRequeridas: 1,
              })}
              className="bg-success hover:bg-success/90 text-white px-3 py-1.5 rounded-md flex items-center gap-2 text-sm"
            >
              <Plus size={16} /> Agregar Etapa
            </button>
          </div>

          <div className="space-y-4" data-testid="etapas-container">
            {fields.map((field: { id: string }, index: number) => (
              <div key={field.id} className="border border-border rounded-lg p-4 bg-muted flex items-start gap-4">
                <div className="flex flex-col gap-1 mt-1">
                  <button
                    type="button"
                    title="Subir etapa"
                    aria-label="Subir etapa"
                    onClick={() => index > 0 && swap(index, index - 1)}
                    disabled={index === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button
                    type="button"
                    title="Bajar etapa"
                    aria-label="Bajar etapa"
                    onClick={() => index < fields.length - 1 && swap(index, index + 1)}
                    disabled={index === fields.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">


                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Etapa</label>
                    <select
                      {...register(`etapas.${index}.etapa`)}
                      className="block w-full rounded-md border border-border bg-background text-foreground px-3 py-1.5 shadow-sm text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    >
                      <option value={0}>Seleccione...</option>
                      {etapasOptions.map(e => (
                        <option key={e.id} value={e.id}>{e.nombre}</option>
                      ))}
                    </select>
                    {errors.etapas?.[index]?.etapa && (
                      <span className="text-destructive text-xs">{errors.etapas[index]?.etapa?.message}</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Muestras Requeridas</label>
                    <input
                      type="number"
                      {...register(`etapas.${index}.cantidadMuestrasRequeridas`)}
                      className="block w-full rounded-md border border-border bg-background text-foreground px-3 py-1.5 shadow-sm text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Peso Mínimo</label>
                    <input
                      type="number"
                      step="0.001"
                      {...register(`etapas.${index}.pesoMinimo`)}
                      className="block w-full rounded-md border border-border bg-background text-foreground px-3 py-1.5 shadow-sm text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Peso Ideal</label>
                    <input
                      type="number"
                      step="0.001"
                      {...register(`etapas.${index}.pesoIdeal`)}
                      className="block w-full rounded-md border border-border bg-background text-foreground px-3 py-1.5 shadow-sm text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-muted-foreground mb-1">Peso Máximo</label>
                    <input
                      type="number"
                      step="0.001"
                      {...register(`etapas.${index}.pesoMaximo`)}
                      className="block w-full rounded-md border border-border bg-background text-foreground px-3 py-1.5 shadow-sm text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  title="Eliminar etapa"
                  aria-label="Eliminar etapa"
                  onClick={async () => {
                    if (fields.length === 1) {
                      const confirmed = await confirm({
                        title: "¿Esta seguro que desea eliminar la ultima etapa? \nNo se podra asignar una ruta sin etapas a una linea de produccion",
                        confirmText: 'Eliminar',
                        cancelText: 'Cancelar',
                        variant: 'destructive',
                      });
                      if (confirmed) {
                        remove(index);
                      }
                    } else {
                      remove(index);
                    }
                  }}
                  className="p-2 text-muted-foreground hover:text-destructive mt-5"
                >
                  <Trash size={18} />
                </button>
              </div>
            ))}
          </div>
        </CollapsibleSection>

        {/* Articulos asignados */}
        <CollapsibleSection
          title="Artículos Asignados"
          count={articulosMostrados.length}
        >
          {/* Selector to add a new articulo */}
          <div className="flex gap-2 mb-4">
            <select
              value={selectedArticuloId}
              onChange={(e) => setSelectedArticuloId(Number(e.target.value))}
              aria-label="Seleccionar artículo"
              className="flex-1 rounded-md border border-border bg-background text-foreground px-3 py-2 shadow-sm text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value={0}>Seleccione un artículo...</option>
              {articulosOptions
                .filter(a => !articulosAsignadosIds.has(a.id!))
                .map(a => (
                  <option key={a.id} value={a.id}>
                    {a.marca ? `[${a.marca}] ` : ''}{a.nombre}
                  </option>
                ))
              }
            </select>
            <button
              type="button"
              onClick={handleAddArticulo}
              disabled={!selectedArticuloId || addArticuloMutation.isPending}
              aria-label="Agregar artículo"
              className="bg-success hover:bg-success/90 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm disabled:opacity-50"
            >
              <Plus size={16} /> Agregar
            </button>
          </div>

          {/* List of assigned articulos */}
          {articulosMostrados.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin artículos asignados.</p>
          ) : (
            <ul className="space-y-2">
              {articulosMostrados.map(item => (
                <li
                  key={item.id}
                  className="flex items-center justify-between border border-border rounded-lg px-4 py-2 bg-muted"
                >
                  <span className="text-sm text-foreground">
                    {item.articulo.marca ? (
                      <span className="text-muted-foreground mr-1">[{item.articulo.marca}]</span>
                    ) : null}
                    {item.articulo.nombre}
                  </span>
                  <button
                    type="button"
                    title="Quitar artículo"
                    aria-label="Quitar artículo"
                    onClick={() => handleRemoveArticulo(item.id)}
                    disabled={removeArticuloMutation.isPending}
                    className="p-1 text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    <Trash size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </CollapsibleSection>

        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            {isEditing && ruta?.activo !== false && (
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 disabled:opacity-50 flex items-center gap-2"
              >
                <Trash size={18} /> Eliminar Ruta
              </button>
            )}
            {isEditing && ruta?.activo === false && (
              <button
                type="button"
                onClick={handleReactivar}
                disabled={updateMutation.isPending}
                className="px-4 py-2 text-success border border-success/30 rounded-md hover:bg-success/10 disabled:opacity-50 flex items-center gap-2 mr-auto"
              >
                <RefreshCw size={18} /> Reactivar Ruta
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard/rutas')}
              className="px-4 py-2 border border-border rounded-md text-foreground hover:bg-accent"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isBusy}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} /> {isBusy ? 'Guardando...' : 'Guardar Ruta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
