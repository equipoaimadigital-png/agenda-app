import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Política de Privacidad",
};

const LAST_UPDATED = "18 de agosto de 2026";

export default function PrivacidadPage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <Link href="/" className="text-sm text-stone hover:text-ink underline">
          ← Volver a Tu Hora Lista
        </Link>

        <h1 className="font-display font-semibold text-3xl sm:text-4xl mt-6 mb-2">
          Política de Privacidad
        </h1>
        <p className="text-sm text-stone mb-10">Última actualización: {LAST_UPDATED}</p>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-xl mb-2">1. Quiénes tratan tus datos</h2>
            <p>
              Tu Hora Lista es operada por AIMA Digital. Esta política aplica tanto a los
              profesionales/negocios que usan la plataforma para gestionar su agenda
              (&quot;el negocio&quot;) como a las personas que reservan una hora con ellos
              (&quot;el cliente final&quot;). AIMA Digital actúa como responsable del tratamiento
              de los datos de cuenta del negocio, y como encargado del tratamiento de los datos
              de los clientes finales que cada negocio recolecta a través de su página de reserva.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">2. Qué datos recolectamos</h2>
            <p className="font-medium mt-1">Del negocio (cuenta del profesional):</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Nombre del negocio, correo electrónico y contraseña (cifrada, nunca la vemos en texto plano)</li>
              <li>Datos de contacto opcionales: dirección, teléfono, redes sociales, foto de portada</li>
              <li>Datos de facturación de la suscripción, procesados directamente por Mercado Pago — nunca vemos ni guardamos el número de tu tarjeta</li>
            </ul>
            <p className="font-medium mt-3">De los clientes finales (quienes reservan con un negocio):</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Nombre, teléfono y correo electrónico (el correo es opcional)</li>
              <li>Fecha de cumpleaños, si el negocio la registra (solo día y mes, nunca el año)</li>
              <li>Historial de reservas: qué servicio, cuándo, y respuestas a preguntas puntuales que el negocio haya configurado</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">3. Para qué usamos estos datos</h2>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Operar el agendamiento: crear, confirmar, recordar, cancelar o reprogramar citas</li>
              <li>Que el negocio pueda gestionar su propia relación con sus clientes (historial de visitas, segmentación por frecuencia)</li>
              <li>Enviar los correos de campaña que el negocio decida mandar a sus propios clientes — nunca vendemos ni compartimos estos datos con otros negocios ni con terceros ajenos a la operación</li>
              <li>Cobrar la suscripción mensual del negocio a la plataforma</li>
              <li>Detectar y corregir errores técnicos de la aplicación</li>
            </ul>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">4. Con quién compartimos datos</h2>
            <p>
              No vendemos datos a nadie. Usamos proveedores de infraestructura que procesan datos
              en nuestro nombre, bajo sus propias políticas de seguridad:
            </p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li><strong>Supabase</strong> — base de datos y autenticación</li>
              <li><strong>Vercel</strong> — hosting de la aplicación</li>
              <li><strong>Resend</strong> — envío de correos transaccionales y de campaña</li>
              <li><strong>Twilio</strong> — envío de los SMS y mensajes de WhatsApp de confirmación y recordatorio (recibe el nombre, teléfono, servicio y hora de la cita)</li>
              <li><strong>Mercado Pago</strong> — procesamiento del cobro de la suscripción</li>
              <li><strong>Sentry</strong> — detección de errores técnicos (recibe información del error, no datos de reservas)</li>
            </ul>
            <p className="mt-2">
              Estos proveedores pueden almacenar datos en servidores fuera de Chile. Al usar la
              plataforma, aceptas esta transferencia internacional, necesaria para operar el servicio.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">5. Cookies</h2>
            <p>
              Usamos únicamente la cookie de sesión necesaria para mantenerte conectado a tu
              cuenta del panel. No usamos cookies de publicidad ni de seguimiento de terceros, y
              no hay ningún script de analítica de comportamiento en la página pública de reserva.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">6. Cuánto tiempo guardamos los datos</h2>
            <p>
              Mientras la cuenta del negocio esté activa. Si un negocio cierra su cuenta, sus datos
              y los de sus clientes se eliminan de forma razonable, salvo lo que debamos conservar
              por obligación legal (ej. registros de cobro). Un cliente final puede pedir la
              eliminación de sus propios datos escribiendo directamente al negocio con el que reservó,
              o a nosotros si el negocio ya no está activo.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">7. Tus derechos (Ley 21.719, Chile)</h2>
            <p>Puedes solicitar en cualquier momento:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li><strong>Acceso:</strong> saber qué datos tuyos tenemos</li>
              <li><strong>Rectificación:</strong> corregir datos incorrectos o desactualizados</li>
              <li><strong>Eliminación:</strong> que borremos tus datos, salvo obligación legal de conservarlos</li>
              <li><strong>Oposición:</strong> dejar de recibir campañas de email — cada campaña incluye un link de desuscripción de un clic</li>
            </ul>
            <p className="mt-2">
              Para ejercer cualquiera de estos derechos, escribe a{" "}
              <a href="mailto:soporte@tuhoralista.com" className="underline text-brand">
                soporte@tuhoralista.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">8. Seguridad</h2>
            <p>
              Los datos viajan cifrados (HTTPS) y la base de datos aplica Row Level Security: un
              negocio nunca puede ver los datos de otro negocio, aunque comparta la misma
              infraestructura. Las contraseñas se guardan cifradas, nunca en texto plano.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">9. Cambios a esta política</h2>
            <p>
              Si hacemos un cambio significativo, avisamos por correo o dentro del panel antes de
              que entre en vigencia.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">10. Contacto</h2>
            <p>
              ¿Dudas sobre esta política? Escríbenos a{" "}
              <a href="mailto:soporte@tuhoralista.com" className="underline text-brand">
                soporte@tuhoralista.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
