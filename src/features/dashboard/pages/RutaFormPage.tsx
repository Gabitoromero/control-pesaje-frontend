import { useEffect, useState } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import type { Control, UseFormRegister, FieldErrors, UseFieldArrayRemove, UseFieldArrayMove } from 'react-hook-form';
import type { Resolver } from 'react-hook-form';
import type { DragEndEvent } from '@dnd-kit/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRuta, createRuta, updateRuta, deleteRuta } from '../../../api/rutas';
import { getEtapas } from '../../../api/etapas';
import { getArticulos } from '../../../api/articulos';
import { getArticulosDeRuta, addArticuloARuta, removeArticuloDeRuta } from '../../../api/articulos-ruta';
import type { ArticuloRutaPasadaItem } from '../../../shared/types/domain';
import { Plus, Trash, ArrowLeft, Save, RefreshCw, GripVertical, Minus } from 'lucide-react';
import { toast } from 'sonner';
import { SearchableCombobox } from '../../../components/ui/SearchableCombobox';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';



const SortableEtapaItem = ({
  id,
  index,
  register,
  control,
  errors,
  etapasOptions,
  remove,
  fieldsLength,
  confirm
}: {
  id: string;
  index: number;
  register: UseFormRegister<RutaFormValues>;
  control: Control<RutaFormValues>;
  errors: FieldErrors<RutaFormValues>;
  etapasOptions: { id?: number; nombre: string }[];
  remove: UseFieldArrayRemove;
  swap: UseFieldArrayMove;
  fieldsLength: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  confirm: any;
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 1 : 0,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex gap-4 bg-card border rounded-xl p-5 shadow-sm transition-colors duration-200 ${isOver ? 'border-primary' : 'border-border'}`}
    >
      <div className="flex flex-col items-center gap-2 pt-1">
        <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 text-primary font-mono text-xs font-bold flex items-center justify-center">
          {index + 1}
        </div>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="p-1 text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing focus:outline-none focus:ring-0 focus-visible:ring-0 touch-none"
          title="Arrastrar para reordenar"
        >
          <GripVertical size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col gap-5">
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className="flex-[1.3] flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Etapa</label>
            <Controller
              name={`etapas.${index}.etapa`}
              control={control}
              render={({ field: { value, onChange } }) => (
                <SearchableCombobox value={value} onChange={onChange} options={etapasOptions} placeholder="Buscar etapa..." />
              )}
            />
            {errors.etapas?.[index]?.etapa && (
              <span className="text-destructive text-xs">{errors.etapas[index]?.etapa?.message}</span>
            )}
          </div>

          <div className="flex-1 flex flex-col gap-1.5 w-full">
            <label className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Muestras Requeridas</label>
            <div className="flex items-center gap-2">
              <Controller
                name={`etapas.${index}.cantidadMuestrasRequeridas`}
                control={control}
                render={({ field: { value, onChange } }) => (
                  <>
                    <button
                      type="button"
                      onClick={() => onChange(Math.max(1, (Number(value) || 1) - 1))}
                      className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Minus size={16} />
                    </button>
                    <div className="min-w-[48px] text-center font-mono text-lg font-bold text-primary bg-primary/10 border border-primary/20 rounded-md py-1 px-1">
                      {value || 1}
                    </div>
                    <button
                      type="button"
                      onClick={() => onChange((Number(value) || 1) + 1)}
                      className="w-8 h-8 rounded-md bg-secondary border border-border flex items-center justify-center hover:bg-muted"
                    >
                      <Plus size={16} />
                    </button>
                  </>
                )}
              />
            </div>
          </div>

          <button
            type="button"
            title="Eliminar etapa"
            onClick={async () => {
              if (fieldsLength === 1) {
                const confirmed = await confirm({
                  title: "¿Esta seguro que desea eliminar la ultima etapa? \nNo se podra asignar una ruta sin etapas a una linea de produccion",
                  confirmText: 'Eliminar',
                  cancelText: 'Cancelar',
                  variant: 'destructive',
                });
                if (confirmed) remove(index);
              } else {
                remove(index);
              }
            }}
            className="md:mt-6 w-8 h-8 rounded-md border border-border text-muted-foreground flex items-center justify-center hover:text-destructive hover:border-destructive/40 hover:bg-destructive/10 transition-colors"
          >
            <Trash size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">Rango de Peso (kg)</label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-amber-500">Mínimo</span>
              </div>
              <input
                type="number"
                step="0.001"
                {...register(`etapas.${index}.pesoMinimo`, { valueAsNumber: true })}
                className="w-full bg-background border border-amber-500/30 rounded text-foreground font-mono text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:[color-scheme:dark] [&::-webkit-inner-spin-button]:opacity-50 [&::-webkit-outer-spin-button]:opacity-50"
              />
            </div>
            
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-primary">Ideal</span>
              </div>
              <input
                type="number"
                step="0.001"
                {...register(`etapas.${index}.pesoIdeal`, { valueAsNumber: true })}
                className="w-full bg-background border border-primary/30 rounded text-foreground font-mono text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-primary dark:[color-scheme:dark] [&::-webkit-inner-spin-button]:opacity-50 [&::-webkit-outer-spin-button]:opacity-50"
              />
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-2.5">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-1.5 h-1.5 rounded-full bg-destructive"></span>
                <span className="text-[10px] font-bold tracking-widest uppercase text-destructive">Máximo</span>
              </div>
              <input
                type="number"
                step="0.001"
                {...register(`etapas.${index}.pesoMaximo`, { valueAsNumber: true })}
                className="w-full bg-background border border-destructive/30 rounded text-foreground font-mono text-sm px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-destructive dark:[color-scheme:dark] [&::-webkit-inner-spin-button]:opacity-50 [&::-webkit-outer-spin-button]:opacity-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
import { rutaSchema } from './RutaFormPage.schemas.js';
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection';
import { useDialog } from '../../../components/dialogs/useDialog';
import { getApiErrorMessage } from '../../../utils/errors';
import { useActividadGlobal } from '../hooks/useActividadGlobal';


type RutaFormValues = z.infer<typeof rutaSchema>;

export const RutaFormPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, alertError } = useDialog();
  const isEditing = Boolean(id);

  const { hayActividad } = useActividadGlobal();

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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = fields.findIndex((item) => item.id === active.id);
      const newIndex = fields.findIndex((item) => item.id === over?.id);
      swap(oldIndex, newIndex);
    }
  };

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

      {hayActividad && (
        <div className="mb-6 p-4 bg-warning/20 border border-warning/50 rounded-md text-foreground">
          <p className="font-semibold flex items-center gap-2">
            ⚠️ Bloqueo de seguridad activo
          </p>
          <p className="text-sm mt-1">
            No se permite crear o editar rutas mientras haya pasadas o sesiones activas en el sistema.
          </p>
        </div>
      )}

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

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="space-y-4" data-testid="etapas-container">
              <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                {fields.map((field: { id: string }, index: number) => (
                  <SortableEtapaItem
                    key={field.id}
                    id={field.id}
                    index={index}
                    register={register}
                    control={control}
                    errors={errors}
                    etapasOptions={etapasOptions}
                    remove={remove}
                    swap={swap}
                    fieldsLength={fields.length}
                    confirm={confirm}
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        </CollapsibleSection>

        {/* Articulos asignados */}
        <CollapsibleSection
          title="Artículos Asignados"
          count={articulosMostrados.length}
        >
          {/* Selector to add a new articulo */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1">
              <SearchableCombobox 
                value={selectedArticuloId} 
                onChange={(val) => setSelectedArticuloId(val)}
                options={articulosOptions
                  .filter(a => !articulosAsignadosIds.has(a.id!))
                  .map(a => ({ id: a.id, nombre: a.marca ? `[${a.marca}] ${a.nombre}` : a.nombre }))
                } 
                placeholder="Buscar artículo..." 
              />
            </div>
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
                disabled={deleteMutation.isPending || hayActividad}
                className="px-4 py-2 text-destructive border border-destructive/30 rounded-md hover:bg-destructive/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Trash size={18} /> Eliminar Ruta
              </button>
            )}
            {isEditing && ruta?.activo === false && (
              <button
                type="button"
                onClick={handleReactivar}
                disabled={updateMutation.isPending || hayActividad}
                className="px-4 py-2 text-success border border-success/30 rounded-md hover:bg-success/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mr-auto"
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
              disabled={isBusy || hayActividad}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Save size={18} /> {isBusy ? 'Guardando...' : 'Guardar Ruta'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
