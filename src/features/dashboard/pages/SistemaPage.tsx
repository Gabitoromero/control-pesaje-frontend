import type { ReactNode } from 'react';
import { BookOpen } from 'lucide-react';
import { CollapsibleSection } from '../../../components/ui/CollapsibleSection';

function Nota({ children, clave = false }: { children: ReactNode; clave?: boolean }) {
  return (
    <div
      className={`text-sm rounded-md px-4 py-3 my-3 border-l-4 ${
        clave
          ? 'bg-brand-muted border-brand text-foreground'
          : 'bg-muted border-border text-foreground'
      }`}
    >
      {children}
    </div>
  );
}

function Comando({ children }: { children: string }) {
  return (
    <pre className="bg-neutral-900 text-neutral-100 text-xs font-mono rounded-md px-4 py-3 my-2 overflow-x-auto whitespace-pre">
      {children}
    </pre>
  );
}

function C({ children }: { children: ReactNode }) {
  return (
    <code className="bg-muted px-1.5 py-0.5 rounded text-[13px] font-mono text-foreground">
      {children}
    </code>
  );
}

function Tabla({ headers, rows }: { headers: string[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-x-auto my-3 border border-border rounded-md">
      <table className="min-w-full divide-y divide-border text-sm">
        <thead className="bg-muted">
          <tr>
            {headers.map((h) => (
              <th
                key={h}
                className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-card divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-2 align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Sub({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mb-6 last:mb-0">
      <h4 className="text-[15px] font-semibold text-foreground border-b border-border pb-1.5 mb-2">
        {title}
      </h4>
      <div className="text-sm text-foreground/90 leading-relaxed space-y-2">{children}</div>
    </div>
  );
}

function Caja({
  destacada = false,
  titulo,
  detalle,
}: {
  destacada?: boolean;
  titulo: string;
  detalle: string;
}) {
  return (
    <div
      className={`rounded-md border px-3 py-2.5 text-center text-xs font-semibold min-w-[110px] flex-1 basis-[130px] ${
        destacada
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-muted text-foreground border-border'
      }`}
    >
      {titulo}
      <span
        className={`block font-normal text-[11px] mt-1 ${
          destacada ? 'text-primary-foreground/80' : 'text-muted-foreground'
        }`}
      >
        {detalle}
      </span>
    </div>
  );
}

export function SistemaPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6" />
          Sistema
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Documentación técnica de referencia del Controlador de Pesaje.
        </p>
      </div>

      <CollapsibleSection title="Manual — Rol Operario" count={7} defaultOpen>
        <p className="text-sm text-muted-foreground mb-5">
          Uso diario de la tablet asignada a cada línea de producción: ingreso, selección de
          línea, registro de muestras de una pasada y muestras libres de calidad.
        </p>

        <Nota>
          Las <strong>etapas</strong> que ves en la tablet (por ejemplo "Peso Cono", "Peso Mix",
          "Altura Crema", "Temperatura") <strong>no son fijas</strong>: dependen de la{' '}
          <strong>ruta</strong> configurada para tu línea, y esa ruta cambia según el artículo o
          proceso que se esté pesando. La cantidad de muestras requeridas y el rango de peso de
          cada etapa también se definen por ruta, no son iguales en todas las líneas.
        </Nota>

        <Sub title="1. Ingreso al sistema">
          <p>
            El ingreso a la tablet <strong>no usa usuario y contraseña</strong>: se hace con tu{' '}
            <strong>legajo</strong> (numérico) y tu <strong>PIN</strong> (4 a 6 dígitos), usando
            un teclado numérico táctil en pantalla (dígitos del 0 al 9 y una tecla de borrar).
          </p>
          <p>
            El ingreso tiene dos pasos, marcados con un indicador visual (ícono de usuario y
            luego candado): primero "Ingresá tu legajo", después "Ingresá tu PIN". Si alguno de
            los dos datos es incorrecto, el sistema muestra el error "PIN o legajo incorrecto" y
            hay que volver a intentar.
          </p>
        </Sub>

        <Sub title="2. Selección de línea de producción">
          <p>
            Después de ingresar, se muestra la pantalla "Seleccionar Línea de Producción" con
            todas las líneas disponibles. Cada línea aparece marcada como{' '}
            <strong>"Disponible"</strong> u <strong>"Ocupada"</strong>: una línea ocupada por otro
            operario queda deshabilitada y no se puede seleccionar. Este estado se actualiza en
            vivo (por WebSocket) a medida que otros operarios entran o salen de una línea.
          </p>
          <p>
            Al elegir una línea se abre una <strong>sesión de línea exclusiva</strong> para vos:
            mientras la tengas abierta, ningún otro operario puede tomarla. Si dos operarios
            intentan tomar la misma línea casi al mismo tiempo, el segundo recibe un aviso de
            "Línea ocupada" y no puede continuar.
          </p>
        </Sub>

        <Sub title="3. Espacio de trabajo (registro de muestras)">
          <Nota clave>
            No existe un botón para "avanzar de etapa". El paso de una etapa a la siguiente es{' '}
            <strong>automático</strong>: se calcula solo, comparando cuántas muestras "OK"
            llevás registradas contra la cantidad requerida para esa etapa en la ruta activa.
          </Nota>
          <p>
            El peso se recibe <strong>en vivo desde la balanza</strong>, por WebSocket — nunca se
            escribe a mano. Mientras la etapa activa está en curso, el botón principal es{' '}
            <strong>"Registrar Muestra"</strong>, que toma el peso que la balanza está mostrando
            en ese instante.
          </p>
          <p>
            Hay un control de <strong>unidad de balanza (gramos / kilogramos)</strong> que se
            puede cambiar en vivo desde la misma pantalla, con una confirmación antes de
            aplicarlo.
          </p>
          <p>
            Si el peso registrado se aleja más de un <strong>20% del rango mínimo o máximo</strong>{' '}
            configurado para esa etapa, el registro queda <strong>bloqueado</strong> y aparece un
            aviso visual de tolerancia excedida — hay que corregir el peso (o consultar a tu
            Jefe) antes de poder seguir.
          </p>
          <p>
            Cuando ya no queda ninguna etapa activa (todas completaron su cantidad de muestras
            requeridas), el botón "Registrar Muestra" es reemplazado por{' '}
            <strong>"Finalizar Pasada"</strong>, que cierra la pasada.
          </p>
          <p>
            Si un Jefe o Administrador aborta tu pasada mientras la tenés abierta (ver sección
            "Pasadas Activas" del manual de Jefe), te aparece un diálogo de aviso en la tablet y
            volvés forzado al listado de pasadas.
          </p>
        </Sub>

        <Sub title="4. Iniciar una pasada nueva">
          <Nota clave>
            El operario <strong>no elige el artículo</strong> de la pasada. El artículo que se
            pesa queda fijado por la configuración de la línea (la arma tu Jefe o Administrador
            desde Parametrización → Líneas).
          </Nota>
          <p>
            Desde la pantalla de Gestión de Pasadas, al iniciar una pasada nueva solo se piden dos
            datos: la <strong>balanza</strong> a usar (obligatorio) y una{' '}
            <strong>observación opcional</strong> — el sistema sugiere copiar la observación ya
            cargada en la línea, si existe.
          </p>
          <p>
            Si la línea no tiene una ruta asignada, o no tiene un dispositivo/balanza vinculados,
            el botón "Nueva Pasada" aparece deshabilitado, con un mensaje que explica qué falta
            configurar (esa parte la resuelve tu Jefe o Administrador, no vos).
          </p>
        </Sub>

        <Sub title="5. Gestión de pasadas propias">
          <p>
            En esta pantalla ves únicamente las pasadas <strong>en curso</strong> que iniciaste
            vos en la línea activa. Podés continuar una pasada que ya habías empezado, pero{' '}
            <strong>no podés abortarla ni eliminarla</strong> — esa acción es exclusiva de Jefe y
            Administrador, y en el sistema se llama "abortar" (con motivo obligatorio), no
            "eliminar".
          </p>
        </Sub>

        <Sub title="6. Cierre de sesión por inactividad">
          <Nota clave>
            No existe una pantalla de "bloqueo" que se destrabe con el PIN. Lo que hay es un{' '}
            <strong>cierre de sesión completo</strong>: al vencer el tiempo de inactividad, la
            sesión se cierra del todo y hay que volver a ingresar legajo y PIN desde cero.
          </Nota>
          <p>
            30 segundos antes del cierre, aparece un aviso en pantalla ("Tu sesión expirará por
            inactividad en 30 segundos") acompañado de un doble sonido. Si no hay actividad en ese
            lapso, la sesión se cierra, se limpia el acceso y la tablet vuelve a la pantalla de
            ingreso.
          </p>
          <p>
            Lo mismo ocurre si un Administrador fuerza el cierre de sesión de esa línea desde
            "Sesiones Activas": el flujo es igual, solo cambia el mensaje mostrado. Mientras estás
            activo en la tablet, un chequeo periódico ("heartbeat") mantiene la sesión viva.
          </p>
        </Sub>

        <Sub title="7. Muestras libres">
          <p>
            Es una toma de muestras de calidad <strong>fuera de una pasada normal</strong>, visible
            solo si tu usuario tiene habilitado el permiso{' '}
            <strong>"Puede tomar muestras libres"</strong> — ese permiso lo activa un Administrador
            al crear o editar tu usuario, el Jefe no puede otorgarlo.
          </p>
          <p>
            Se accede desde el botón "Tomar Muestras Libres" en la sección "Muestras de Calidad
            Libre" de Gestión de Pasadas (visible solo si tenés el permiso, y la línea tiene ruta
            y dispositivo asignados). A diferencia de una pasada, acá{' '}
            <strong>no se pide artículo</strong>.
          </p>
          <p>
            Elegís la etapa desde una fila de opciones con la ruta activa de la línea: cualquier
            etapa se puede tocar en cualquier momento, sin un orden obligatorio (a diferencia de
            la pasada normal, donde las etapas se completan una detrás de otra). El peso se toma
            en vivo por WebSocket, igual que en el espacio de trabajo normal. La observación de
            cada muestra se agrega o edita <strong>después</strong>, tocando la muestra ya
            registrada.
          </p>
          <p>
            Hay un límite duro de <strong>20 muestras por sesión</strong>. El botón final es{' '}
            <strong>"Finalizar Muestras"</strong> (no pide confirmación), limpia la sesión local y
            vuelve al listado de pasadas.
          </p>
        </Sub>
      </CollapsibleSection>

      <CollapsibleSection title="Manual — Rol Jefe" count={9}>
        <p className="text-sm text-muted-foreground mb-5">
          Supervisión de planta y configuración de líneas, rutas, artículos y etapas desde el
          navegador. El Jefe ve todo esto además de poder entrar a la tablet como Operario.
        </p>

        <Sub title="1. Monitoreo (Dashboard)">
          <p>
            Es la pantalla de inicio del panel web. No cambia según el rol: Jefe, Administrador y
            Visualización ven exactamente la misma pantalla de Monitoreo.
          </p>
          <p>
            Muestra un selector de línea, KPIs (muestras totales, muestras fuera de rango, pasadas
            finalizadas, pasadas en curso), un banner con la observación cargada en la línea, y un
            carrusel con el progreso de cada etapa de la ruta activa.
          </p>
          <p>
            Tiene un botón de pantalla completa (sin menú lateral) pensado para dejar el dashboard
            fijo en una pantalla de TV de planta.
          </p>
        </Sub>

        <Sub title="2. Pasadas Activas">
          <p>
            Pantalla exclusiva de Jefe y Administrador (grupo de menú "Administración"). Lista
            todas las pasadas en curso de todas las líneas: línea, operario, artículo, hora de
            inicio y estado.
          </p>
          <Nota clave>
            La única acción disponible es <strong>"Abortar Pasada"</strong> (botón destructivo),
            que pide un motivo obligatorio antes de confirmar. No existe una opción para
            "reasignar" una pasada a otra línea.
          </Nota>
        </Sub>

        <Sub title="3. Parametrización — Artículos">
          <p>
            Campos del formulario: código (obligatorio), nombre (obligatorio) y descripción
            (opcional).
          </p>
          <p>
            No hay "bloqueo" de artículo: la acción es <strong>eliminar</strong> (borrado lógico,
            no borra el historial de pasadas ya hechas con ese artículo) con el botón "Eliminar
            Artículo" más confirmación, y "Activar Artículo" para reactivar uno eliminado. El
            alta, la edición y la eliminación se bloquean mientras el artículo tiene actividad
            (pasadas o sesiones en curso).
          </p>
        </Sub>

        <Sub title="4. Parametrización — Etapas">
          <p>
            El catálogo de Etapas es simple: solo <strong>nombre</strong>, <strong>descripción</strong>{' '}
            y estado activo/inactivo.
          </p>
          <Nota clave>
            La cantidad de muestras requeridas y el rango de peso (mínimo / ideal / máximo) de una
            etapa <strong>no se configuran acá</strong>: se definen dentro de cada Ruta, al
            asignarle esa etapa (ver "Parametrización — Rutas" más abajo).
          </Nota>
          <p>
            Mismo patrón que Artículos: eliminar (borrado lógico) / activar, con bloqueo mientras
            hay actividad asociada.
          </p>
        </Sub>

        <Sub title="5. Parametrización — Balanzas">
          <p>
            Catálogo simple, con un único campo: <strong>nombre</strong>. Mismo patrón de eliminar
            / activar que los catálogos anteriores. Si una balanza está asignada a una línea o
            tiene pasadas registradas, no se puede eliminar y el sistema muestra un mensaje de
            error específico.
          </p>
        </Sub>

        <Sub title="6. Parametrización — Líneas">
          <p>Campos del formulario de una línea de producción:</p>
          <Tabla
            headers={['Campo', 'Obligatorio', 'Uso']}
            rows={[
              ['Nombre', 'Sí', 'Identifica la línea en todo el sistema'],
              ['Balanza', 'Sí', 'Balanza física asociada a esta línea'],
              ['Artículo', 'Sí', 'Fija qué artículo se pesa en esta línea (el operario no lo elige)'],
              ['Dispositivo', 'No', 'Vincula la Raspberry Pi a esta línea'],
              ['Ruta Activa', 'No', 'Ruta de etapas que va a seguir el operario en esta línea'],
              ['Observación', 'No', 'Texto libre, visible en Monitoreo y sugerido al operario'],
            ]}
          />
          <p>
            Si se guarda una línea sin Ruta Activa, el sistema no muestra la confirmación simple
            de éxito habitual, sino un aviso: <strong>"Línea guardada sin ruta activa"</strong>.
          </p>
        </Sub>

        <Sub title="7. Parametrización — Rutas">
          <p>
            Una ruta define un nombre, una descripción, y una lista{' '}
            <strong>ordenable (arrastrar y soltar)</strong> de etapas. Cada etapa dentro de la
            ruta tiene tres datos propios, además de la etapa del catálogo que representa:
          </p>
          <Tabla
            headers={['Dato de la etapa en la ruta', 'Detalle']}
            rows={[
              ['Cantidad de muestras requeridas', 'Mínimo 1 — define cuándo esa etapa se da por completa'],
              ['Peso mínimo (kg)', 'Límite inferior del rango de tolerancia'],
              ['Peso ideal (kg)', 'Valor objetivo de referencia'],
              ['Peso máximo (kg)', 'Límite superior del rango de tolerancia'],
            ]}
          />
          <p>
            Además, cada ruta tiene una sección separada, "Artículos Asignados", donde se arma
            una relación de muchos a muchos: <strong>una ruta puede aplicarse a varios artículos</strong>,
            y un artículo puede tener más de una ruta posible. Los artículos se asignan a la ruta
            desde esta pantalla, no al revés.
          </p>
        </Sub>

        <Sub title="8. Dispositivos Conectados">
          <p>
            Vive dentro del grupo Parametrización, con el título en pantalla "Dispositivos
            Conectados (Raspberry Pi)". Tabla con nombre, identificador de hardware, línea de
            producción asociada, estado de conexión, última conexión y unidad configurada.
          </p>
          <Nota clave>
            Desde acá solo se puede editar el <strong>nombre</strong> del dispositivo y{' '}
            <strong>eliminarlo</strong>. No hay un asistente de "vincular dispositivo nuevo" en
            esta pantalla — esa vinculación (dispositivo ↔ línea) se hace desde el formulario de
            Líneas (ver sección 6).
          </Nota>
        </Sub>

        <Sub title="9. Reportes">
          <p>
            Hoy hay un único reporte implementado: <strong>"Reporte de Pasadas y Muestras"</strong>,
            con filtro de rango de fechas (Desde / Hasta). El rango máximo permitido es de{' '}
            <strong>5 días</strong>; un rango mayor no se puede descargar.
          </p>
          <p>
            El botón "Descargar .xlsx" está deshabilitado con la leyenda{' '}
            <strong>"Disponible próximamente"</strong> — todavía no es una función operativa.
          </p>
        </Sub>
      </CollapsibleSection>

      <CollapsibleSection title="Manual — Rol Administrador" count={3}>
        <p className="text-sm text-muted-foreground mb-5">
          El Administrador ve y puede hacer todo lo que puede hacer un Jefe (Monitoreo, Pasadas
          Activas y toda la Parametrización descripta arriba), más dos secciones exclusivas:
          gestión de usuarios y sesiones activas.
        </p>

        <Sub title="1. Todo lo de Jefe">
          <p>
            Monitoreo, Pasadas Activas y el grupo completo de Parametrización (Artículos, Etapas,
            Balanzas, Líneas, Rutas, Dispositivos Conectados) y Reportes funcionan exactamente
            igual que para el rol Jefe — ver "Manual — Rol Jefe" arriba.
          </p>
        </Sub>

        <Sub title="2. Usuarios">
          <p>Pantalla exclusiva de Administrador, dentro del grupo "Administración". Campos:</p>
          <Tabla
            headers={['Campo', 'Obligatorio', 'Detalle']}
            rows={[
              ['Legajo', 'Sí', 'Número que usa el operario para ingresar a la tablet'],
              ['Nombre y apellido', 'Sí', '—'],
              ['Nombre de usuario', 'Sí', '—'],
              ['Rol', 'Sí', 'Administrador / Jefe / Operario / Visualización'],
              ['PIN', 'Sí al crear', 'Al editar es opcional: dejarlo vacío significa "no cambiarlo"'],
              ['Puede tomar muestras libres', 'No', 'Checkbox, en la práctica solo aplica a Operario'],
            ]}
          />
          <p>
            Alta, edición, eliminación (borrado lógico) y reactivación. A diferencia de los
            catálogos de Parametrización, la gestión de usuarios{' '}
            <strong>no se bloquea por actividad</strong> en curso.
          </p>
        </Sub>

        <Sub title="3. Sesiones Activas">
          <p>
            Pantalla exclusiva de Administrador. Tabla con línea, usuario, legajo, inicio de
            sesión, expiración aproximada y estado.
          </p>
          <p>
            La única acción es cerrar sesión (con confirmación). El cierre es{' '}
            <strong>por línea</strong>, no por usuario aislado: fuerza el logout del operario que
            en ese momento tenga esa línea abierta (ver "Cierre de sesión por inactividad" en el
            manual de Operario, mismo flujo, mensaje distinto).
          </p>
        </Sub>
      </CollapsibleSection>

      <CollapsibleSection title="Manual — Rol Visualización" count={1}>
        <p className="text-sm text-muted-foreground mb-5">
          Pensado para quedar fijo en una pantalla o TV de planta, sin un operador activo
          manejándola.
        </p>

        <Sub title="1. Qué ve y qué no ve">
          <p>
            Solo tiene acceso a <strong>Monitoreo</strong> (el mismo dashboard de KPIs que ven
            Jefe y Administrador, con la opción de pantalla completa) y a la sección{' '}
            <strong>Sistema</strong>, donde vive este mismo manual. El ítem "Reportes" no aparece
            en su menú.
          </p>
          <p>
            No tiene acceso a Parametrización, Administración, Pasadas Activas, Usuarios, ni a la
            tablet de operario.
          </p>
        </Sub>
      </CollapsibleSection>

      <CollapsibleSection title="Infraestructura — Raspberry Pi y sincronización" count={6}>
        <p className="text-sm text-muted-foreground mb-5">
          Qué hace la Raspberry Pi de cada línea de producción y cómo se sincroniza con el
          servidor central. Documento de referencia técnica, preparado originalmente para el
          equipo de TI de MONTHELADO.
        </p>

        <Sub title="1. Arquitectura general del sistema">
          <p>
            El sistema tiene cuatro piezas que trabajan juntas: la balanza física, la Raspberry
            Pi de cada línea, el servidor central y las pantallas (tablet de operarios y
            navegador de Jefe/Administrador).
          </p>
          <p className="font-medium">Recorrido del dato de peso</p>
          <p>
            La balanza no se conecta directo al servidor: cada línea tiene su propia Raspberry
            Pi, que actúa de puente entre el hardware de pesaje y el resto del sistema.
          </p>
          <div className="flex items-center gap-2 flex-wrap justify-center my-4">
            <Caja titulo="Balanza" detalle="salida serial RS-232" />
            <span className="text-muted-foreground text-lg flex-shrink-0">→</span>
            <Caja destacada titulo="Raspberry Pi" detalle="lee y retransmite" />
            <span className="text-muted-foreground text-lg flex-shrink-0">→</span>
            <Caja titulo="Servidor backend" detalle="Node.js + base de datos" />
            <span className="text-muted-foreground text-lg flex-shrink-0">→</span>
            <Caja titulo="Tablet del operario" detalle="peso en vivo por WebSocket" />
          </div>
          <p className="text-xs text-muted-foreground text-center">
            La Raspberry Pi depende de la red local para llegar al servidor. La balanza y el
            cable serial no dependen de la red — por eso son puntos distintos a la hora de
            diagnosticar un corte.
          </p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>La balanza emite continuamente tramas de peso por el puerto serial (conexión física, sin red).</li>
            <li>La Raspberry Pi de esa línea las lee, las limpia y valida.</li>
            <li>La Raspberry retransmite el peso al servidor en tiempo real, por WebSocket — acá es donde entra la red.</li>
            <li>El servidor redirige ese peso a la tablet de la línea correspondiente.</li>
          </ol>
        </Sub>

        <Sub title="2. La Raspberry Pi: qué hace y cómo funciona">
          <p>
            Hay una Raspberry Pi por línea de producción, conectada físicamente por cable serial
            a la balanza de esa línea. Es un dispositivo dedicado: su único trabajo es leer la
            balanza y avisarle al servidor.
          </p>

          <p className="font-medium">Identidad propia del dispositivo</p>
          <p>
            La primera vez que se ejecuta, la Raspberry genera un identificador único (UUID) y lo
            guarda en un archivo local (<C>.device-id</C>). Ese <C>hardwareId</C> es lo que le
            permite al servidor reconocer siempre al mismo dispositivo físico, aunque se
            reinicie o cambie de IP.
          </p>

          <p className="font-medium">Lectura de la balanza</p>
          <p>
            Escucha el puerto serial configurado, interpreta cada trama que envía la balanza
            (descartando lecturas inválidas o corruptas) y emite el peso limpio al servidor solo
            cuando el valor cambia. Esta parte no depende de la red: si la balanza deja de
            leerse, el problema está en el cable serial o en la balanza, no en la conectividad.
          </p>

          <p className="font-medium">Configuración por dispositivo</p>
          <p>
            Cada Raspberry tiene su propio archivo de entorno con estos valores, definidos una
            sola vez durante la puesta en marcha:
          </p>
          <Tabla
            headers={['Variable', 'Uso', 'Valor por defecto']}
            rows={[
              [<C>SERIAL_PORT</C>, 'Puerto donde está conectada la balanza', <C>/dev/ttyUSB0</C>],
              [<C>SERIAL_BAUD_RATE</C>, 'Velocidad de comunicación serial', <C>9600</C>],
              [<C>SERVER_URL</C>, 'Dirección del servidor central', <C>http://montheladopesosproductos.com</C>],
            ]}
          />
          <p>
            Vive en <C>~/control-pesaje-raspberry/.env</C> (la carpeta del proyecto clonado,
            dentro del usuario con el que corre el servicio). Para verlo o editarlo por SSH:
          </p>
          <Comando>{'cat ~/control-pesaje-raspberry/.env\nnano ~/control-pesaje-raspberry/.env'}</Comando>
          <p>
            Después de un cambio en el <C>.env</C>, alcanza con reiniciar el servicio — no hace
            falta reinstalar ni recompilar nada, el valor se relee al arrancar el proceso:
          </p>
          <Comando>sudo systemctl restart control-pesaje.service</Comando>

          <p className="font-medium">Identificación física y acceso por SSH</p>
          <p>
            Cada Raspberry tiene un <strong>hostname con el número de línea que tiene asignado
            en su carcasa física</strong> (por ejemplo, la Raspberry de la carcasa marcada "03"
            tiene hostname <C>RB-03</C>). Las Raspberry están distribuidas por la planta, cada
            una junto a la balanza de su línea — no están todas juntas en un rack. El número de
            la carcasa es el mismo que el del hostname, así que sirve para identificar cuál es
            cuál sin tener que rastrear IPs.
          </p>
          <Tabla
            headers={['Línea', 'Hostname', 'IP']}
            rows={[
              ['Línea 1', <C>RB-01</C>, '[A COMPLETAR]'],
              ['Línea 2', <C>RB-02</C>, '[A COMPLETAR]'],
              ['Línea 3', <C>RB-03</C>, '[A COMPLETAR]'],
            ]}
          />
          <p>
            Todas las Raspberry están conectadas por cable de red (no WiFi) a la red de planta,
            con IP fija. Se accede por SSH con las mismas credenciales en las tres:
          </p>
          <Comando>ssh monthelado@[IP de la línea]</Comando>
          <Tabla
            headers={['Usuario', 'Contraseña']}
            rows={[[<C>monthelado</C>, <C>monthelado2026</C>]]}
          />
          <p>
            También se puede conectar directo por hostname, sin memorizar la IP — Raspberry Pi
            OS trae <C>Avahi</C> (mDNS) habilitado por defecto, así que el hostname responde con
            el sufijo <C>.local</C>:
          </p>
          <Comando>ssh monthelado@RB-03.local</Comando>
          <p>
            Esto funciona mientras la máquina desde la que te conectás esté en la misma red y
            soporte mDNS (de fábrica en Linux/macOS; en Windows puede necesitar instalar soporte
            para Bonjour). Si el hostname no resuelve, la IP fija de la tabla queda como
            respaldo seguro.
          </p>
          <Nota>
            <strong>Pendiente:</strong> completar la columna IP de la tabla de arriba con los
            valores reales de la planta actual, para que este documento sirva como el listado de
            referencia de TI.
          </Nota>
        </Sub>

        <Sub title="3. Sincronización con el servidor">
          <p>
            La Raspberry se conecta al servidor central por WebSocket (Socket.IO),
            identificándose con su <C>hardwareId</C>. Este es el punto exacto donde impacta
            cualquier corte de red.
          </p>
          <Nota clave>
            <strong>Importante:</strong> hoy, tanto un corte de red como una reasignación de
            línea se recuperan solos — ninguno de los dos requiere que alguien reinicie el
            servicio. Lo que cambia entre uno y otro es el patrón que se ve en los logs, y eso es
            lo que sirve para distinguirlos.
          </Nota>

          <p className="font-medium">Corte de red (cable, switch, ISP)</p>
          <p>
            Si se pierde la conexión de red — del lado de MONTHELADO — la Raspberry lo detecta y
            reintenta conectarse sola, de forma indefinida. Los reintentos empiezan cada 2
            segundos y van espaciándose hasta un máximo de 30 segundos, para no saturar la red ni
            el servidor mientras dura el corte. Se recupera sola apenas la red vuelve.
          </p>
          <p>
            En <C>journalctl</C> se ve como <strong>varias líneas de desconexión/reintento a lo
            largo del tiempo</strong>, con huecos entre una y otra que van creciendo:
          </p>
          <Comando>{
`[socket] Desconectado: transport close. Reconectando...
[socket] Error de conexión: xhr poll error. Reintentando...
[socket] Error de conexión: xhr poll error. Reintentando...
[socket] Error de conexión: xhr poll error. Reintentando...
[socket] Conectado al servidor: http://montheladopesosproductos.com
[socket] Identificado con hardwareId: 3fa85f64-5717-4562-b3fc-2c963f66afa6`
          }</Comando>

          <p className="font-medium">
            Reasignación de línea desde el panel (desconexión forzada por el servidor)
          </p>
          <p>
            Cuando un Administrador reasigna el dispositivo a otra línea desde el panel, el
            servidor corta esa conexión a propósito (para que no siga mandando datos a la línea
            vieja). La Raspberry se vuelve a conectar sola, casi al instante — sin la espera ni
            los reintentos del caso anterior — y queda emparejada a la línea nueva ya en esa
            misma reconexión.
          </p>
          <p>
            En <C>journalctl</C> se ve como <strong>un solo corte, seguido de inmediato por una
            sola reconexión</strong> — no una seguidilla de reintentos:
          </p>
          <Comando>{
`[socket] Desconectado: io server disconnect. Reconectando...
[socket] Conectado al servidor: http://montheladopesosproductos.com
[socket] Identificado con hardwareId: 3fa85f64-5717-4562-b3fc-2c963f66afa6`
          }</Comando>
          <p>Referencia (funcionamiento normal, sin cortes) — así se ve cuando todo está bien:</p>
          <Comando>{
`[socket] Conectado al servidor: http://montheladopesosproductos.com
[socket] Identificado con hardwareId: 3fa85f64-5717-4562-b3fc-2c963f66afa6
[serial] Puerto abierto: /dev/ttyUSB0 @ 9600 baud
[balanza] Emitido: 84.5 kg`
          }</Comando>

          <p className="font-medium">Cuándo sí puede quedar realmente "colgado"</p>
          <p>Hay dos casos donde no alcanza con esperar, porque no se resuelven solos:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              <strong>Servidor central caído</strong>: la Raspberry va a mostrar reintentos
              infinitos igual que en un corte de red — pero nunca se van a resolver, porque no
              hay nada del otro lado. Si la red de planta está confirmada como sana (otros
              equipos navegan bien) y los reintentos no paran, el problema está del lado del
              servidor/hosting, no de la red local.
            </li>
            <li>
              <strong>Dispositivo sin unidad de peso configurada</strong>: el socket puede quedar
              "conectado" en apariencia, pero el servidor rechaza el emparejamiento a la línea si
              el dispositivo no tiene su unidad de peso (kg/lb) configurada. La tablet no recibe
              peso en vivo aunque no haya ningún corte de red — no se soluciona reiniciando nada.
            </li>
          </ol>
          <Nota>
            <strong>Cómo se revisa hoy:</strong> la unidad de peso no es un dato visible en el
            listado de dispositivos del panel de Administrador — solo se ve y se configura desde
            la tablet de esa línea (pantalla de Workspace o Muestras Libres). Si sospechan este
            caso, hay que entrar a la tablet física de la línea, no al panel web de
            administración. Mejorar esto (mostrar/editar la unidad desde el listado de
            dispositivos) es una mejora de producto pendiente, no algo que exista hoy.
          </Nota>
        </Sub>

        <Sub title="4. Puesta en marcha y arranque automático">
          <p>
            El objetivo es que, una vez instalada, la Raspberry funcione sin intervención manual:
            con solo darle alimentación eléctrica y red, el proceso arranca solo.
          </p>

          <p className="font-medium">Paso 0 — Asignar el hostname de línea</p>
          <p>
            Antes de instalar nada, sobre una Raspberry recién flasheada, se le asigna el
            hostname que corresponde al número de la carcasa donde va a quedar montada en planta
            (ver sección 2):
          </p>
          <Comando>{'sudo hostnamectl set-hostname RB-03\nsudo reboot'}</Comando>

          <p className="font-medium">
            Preparar una Raspberry nueva — <C>setup-raspberry.sh</C>
          </p>
          <p>Se corre una sola vez, después del paso 0:</p>
          <Comando>./setup-raspberry.sh</Comando>
          <p>
            Actualiza el sistema, instala Node.js y pnpm, clona el repositorio del proyecto,
            instala las dependencias y crea el archivo de entorno (<C>.env</C>) con los valores
            de la tabla de la sección 2.
          </p>

          <p className="font-medium">
            Configurar el arranque automático — <C>setup-service.sh</C>
          </p>
          <p>
            Una vez cargado el <C>.env</C> con los datos de esa línea, se instala el servicio del
            sistema operativo que lo mantiene siempre corriendo:
          </p>
          <Comando>./setup-service.sh</Comando>
          <p>
            Esto registra <C>control-pesaje.service</C> en <C>systemd</C>: el proceso arranca
            automáticamente al encender la Raspberry, y si se cae por cualquier motivo, se
            reinicia solo un minuto después. También configura el journal de logs para que quede
            persistente entre reinicios (ver sección 5). No hace falta abrir una terminal ni
            dejar una sesión abierta para que funcione.
          </p>
          <Nota>
            <strong>Depende de:</strong> <C>setup-service.sh</C> necesita que{' '}
            <C>setup-raspberry.sh</C> ya se haya ejecutado antes (proyecto clonado y{' '}
            <C>.env</C> configurado).
          </Nota>

          <p className="font-medium">Reemplazo de hardware (Raspberry rota)</p>
          <p>
            Es probablemente el escenario más común en la vida real: se rompe una Raspberry y hay
            que poner otra en su lugar, ya. El procedimiento es el mismo que para una instalación
            nueva, con dos puntos importantes:
          </p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>
              A la Raspberry de reemplazo se le asigna <strong>el mismo hostname</strong> que
              tenía la que se saca (paso 0) — así se mantiene la identificación física por número
              de carcasa.
            </li>
            <li>
              La Raspberry nueva genera un <C>hardwareId</C> propio la primera vez que arranca
              (es un archivo local, no se puede copiar de la vieja). Para el servidor es un
              dispositivo nuevo: va a aparecer como <strong>"dispositivo desconocido"</strong> en
              el panel del Administrador hasta que alguien lo asigne a la línea correspondiente y
              le configure la unidad de peso — recién ahí empieza a funcionar igual que la
              anterior.
            </li>
          </ol>
          <Nota>
            <strong>En síntesis:</strong> mismo hostname (identificación física) + reasignación
            manual en el panel (identificación lógica) = la Raspberry nueva reemplaza a la vieja
            sin tocar nada del lado del servidor.
          </Nota>
        </Sub>

        <Sub title="5. Diagnóstico básico (por SSH)">
          <p>
            Comandos mínimos para revisar el estado del proceso en una Raspberry ya instalada.
            Útiles para que TI de MONTHELADO ayude a distinguir un problema de red de un problema
            de la aplicación.
          </p>

          <p className="font-medium">Ver el estado del servicio</p>
          <Comando>sudo systemctl status control-pesaje.service</Comando>

          <p className="font-medium">Ver los logs en vivo</p>
          <p>
            Muestra en tiempo real si la balanza está enviando datos y si la conexión al servidor
            está activa, cayendo o reintentando. Se deja corriendo mientras se reproduce el
            problema (se corta con Ctrl+C).
          </p>
          <Comando>journalctl -u control-pesaje.service -f</Comando>

          <p className="font-medium">Ver el historial de logs (sin quedarse esperando)</p>
          <p>
            Para revisar qué pasó antes, sin seguir en vivo — por ejemplo, para confirmar si hubo
            reintentos antes de que alguien avisara del corte:
          </p>
          <Comando>journalctl -u control-pesaje.service --no-pager</Comando>
          <p>O solo las últimas líneas:</p>
          <Comando>journalctl -u control-pesaje.service -n 200 --no-pager</Comando>
          <Nota>
            <strong>Journal persistente:</strong> el journal de estas Raspberry está configurado
            como persistente (sobrevive a un reinicio del sistema operativo, con retención de
            hasta 2 semanas o 200MB). Si una Raspberry ya estaba instalada antes de esta
            configuración, hay que correr <C>./setup-service.sh</C> de nuevo una vez para que
            tome el cambio.
          </Nota>

          <p className="font-medium">Confirmar el puerto serial real de la balanza</p>
          <p>
            Por defecto es <C>/dev/ttyUSB0</C> (el nombre que toma automáticamente el primer, y
            normalmente único, adaptador serial-USB conectado). Para confirmarlo o encontrarlo si
            cambió:
          </p>
          <Comando>ls -l /dev/ttyUSB*</Comando>
          <p>Si no aparece ninguno, el sistema operativo no está viendo el adaptador — se revisa con:</p>
          <Comando>dmesg | grep -i tty</Comando>
          <p>
            Si el puerto real no coincide con el valor de <C>SERIAL_PORT</C> en el <C>.env</C>{' '}
            (sección 2), hay que corregirlo ahí y reiniciar el servicio.
          </p>

          <p className="font-medium">Reiniciar el proceso manualmente</p>
          <p>
            Útil después de corregir el <C>.env</C> o el cable serial. No es necesario para
            recuperarse de un corte de red ni de una reasignación de línea (ver sección 3) — esos
            casos se resuelven solos.
          </p>
          <Comando>sudo systemctl restart control-pesaje.service</Comando>

          <p className="font-medium">Guía rápida de fallas comunes</p>
          <Tabla
            headers={['Síntoma', 'Revisar', 'Lado responsable']}
            rows={[
              [
                'El servicio no arranca',
                <>Valores del <C>.env</C> (<C>~/control-pesaje-raspberry/.env</C>) y que el proyecto esté clonado en la ruta esperada</>,
                'MaciaSoft',
              ],
              [
                'No lee la balanza',
                <>Cable serial conectado y <C>ls /dev/ttyUSB*</C> / <C>dmesg</C> para confirmar que <C>SERIAL_PORT</C> coincide con el puerto real</>,
                'Físico / planta',
              ],
              [
                'Reintentos de conexión intermitentes en los logs (varias líneas de desconexión/reintento espaciadas en el tiempo)',
                'Estabilidad de la red local: cableado, switch, ISP',
                'TI MONTHELADO',
              ],
              [
                'Reintentos que llevan más de ~2 horas sin resolverse, con la red de planta confirmada como sana',
                'Puede ser el servidor central caído, no la red — ver sección 6 (Escalamiento)',
                'MaciaSoft',
              ],
              [
                'Un solo corte seguido de una sola reconexión (no una seguidilla)',
                'Es la firma de una reasignación de línea — no requiere ninguna acción, se resuelve solo',
                'Ninguno (comportamiento normal)',
              ],
              [
                'La tablet no recibe peso en vivo pero el servicio está corriendo sin errores',
                'Que el dispositivo tenga la unidad de peso (kg/lb) configurada — se revisa y configura desde la tablet de esa línea (Workspace / Muestras Libres), no desde el listado de dispositivos del panel',
                'Usuarios del sistema',
              ],
            ]}
          />
        </Sub>

        <Sub title="6. Escalamiento y soporte">
          <p>
            Cómo decidir cuándo un corte deja de ser "red inestable normal" y hay que avisarle a
            MaciaSoft, y qué mandarnos para no ir y venir pidiendo información.
          </p>

          <p className="font-medium">Cuándo escalar</p>
          <p>
            Como referencia inicial: si los reintentos de conexión llevan{' '}
            <strong>más de 2 horas</strong> yendo y viniendo, y ya se confirmó que la red de
            planta está funcionando bien (otros equipos de la misma red navegan sin problemas),
            conviene avisarnos — puede ser el servidor central, no la red local. Este número es
            un punto de partida, no una regla fija: si en la práctica conviene ajustarlo (para
            arriba o para abajo), lo revisamos juntos.
          </p>

          <p className="font-medium">Qué mandarnos</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Línea/hostname afectado (ej. <C>RB-03</C>) y desde cuándo se nota el problema.</li>
            <li>Salida de <C>journalctl -u control-pesaje.service -n 200 --no-pager</C> de esa Raspberry.</li>
            <li>Confirmación de que la red de planta está sana (otro equipo con conexión, ping al servidor, etc.).</li>
          </ol>

          <p className="font-medium">Contacto de soporte</p>
          <Tabla
            headers={['Teléfono', 'Mail']}
            rows={[[<C>+54 9 341 720-6049</C>, <C>contacto@maciasoft.com</C>]]}
          />
        </Sub>
      </CollapsibleSection>
    </div>
  );
}
