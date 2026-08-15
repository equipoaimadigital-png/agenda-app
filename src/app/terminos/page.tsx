import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos de Servicio",
};

const LAST_UPDATED = "14 de agosto de 2026";

export default function TerminosPage() {
  return (
    <main className="bg-paper text-ink min-h-screen">
      <div className="max-w-2xl mx-auto px-5 sm:px-8 py-12 sm:py-16">
        <Link href="/" className="text-sm text-stone hover:text-ink underline">
          ← Volver a Tú Agenda
        </Link>

        <h1 className="font-display font-semibold text-3xl sm:text-4xl mt-6 mb-2">
          Términos de Servicio
        </h1>
        <p className="text-sm text-stone mb-10">Última actualización: {LAST_UPDATED}</p>

        <div className="flex flex-col gap-8 text-[15px] leading-relaxed">
          <section>
            <h2 className="font-display font-semibold text-xl mb-2">1. Qué es Tú Agenda</h2>
            <p>
              Tú Agenda es un servicio de agendamiento online operado por AIMA Digital
              (&quot;nosotros&quot;, &quot;la plataforma&quot;), que permite a profesionales y negocios
              de servicios (&quot;el negocio&quot;, &quot;tú&quot;) crear una página pública de reservas,
              gestionar su disponibilidad y comunicarse con sus propios clientes finales.
              Al crear una cuenta o usar la plataforma, aceptas estos Términos de Servicio.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">2. Tu cuenta</h2>
            <p>
              Debes entregar información veraz al registrarte (nombre del negocio, correo,
              contraseña) y eres responsable de mantener tu contraseña segura y de toda
              actividad que ocurra en tu cuenta. Puedes tener una sola cuenta por negocio.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">3. Prueba gratis y suscripción</h2>
            <p>
              Toda cuenta nueva incluye 14 días de prueba gratis. Al terminar la prueba, el
              uso del panel requiere una suscripción mensual paga (el valor vigente se
              muestra en la sección Suscripción de tu panel), cobrada automáticamente a
              través de Mercado Pago. Puedes cancelar la suscripción cuando quieras desde tu
              cuenta de Mercado Pago; la cancelación no genera devoluciones proporcionales
              del período ya pagado. Si el cobro falla o la suscripción no está activa, el
              acceso a tu panel se bloquea hasta regularizar el pago — tu página pública de
              reservas sigue funcionando normalmente para tus clientes mientras tanto.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">4. Uso permitido</h2>
            <p>Al usar Tú Agenda, te comprometes a no:</p>
            <ul className="list-disc pl-5 mt-2 flex flex-col gap-1">
              <li>Usar la plataforma para actividades ilegales o fraudulentas.</li>
              <li>
                Enviar campañas de email a personas que no sean tus propios clientes o que no
                hayan dado su consentimiento para recibir comunicaciones tuyas.
              </li>
              <li>Enviar spam, contenido engañoso o suplantar la identidad de terceros.</li>
              <li>Intentar vulnerar la seguridad de la plataforma o acceder a datos de otros negocios.</li>
              <li>Revender o sublicenciar el acceso a la plataforma sin autorización nuestra.</li>
            </ul>
            <p className="mt-2">
              Podemos suspender o cerrar cuentas que incumplan estas condiciones, especialmente
              si afectan la entrega de correo del resto de los negocios en la plataforma.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">5. Datos de tus clientes</h2>
            <p>
              Cuando tus clientes reservan contigo, nos entregas (a través de la plataforma)
              sus datos de contacto — nombre, teléfono, correo — para poder operar el
              agendamiento, mandar confirmaciones y recordatorios. Tú eres responsable de
              contar con la base legal necesaria para recolectar y usar esos datos (por
              ejemplo, el consentimiento que te dan al reservar), y de respetar las
              solicitudes de tus clientes de dejar de recibir comunicaciones — la plataforma
              incluye un link de desuscripción de un clic en cada campaña para facilitarlo.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">6. Disponibilidad del servicio</h2>
            <p>
              Hacemos un esfuerzo razonable para mantener la plataforma disponible, pero no
              garantizamos un funcionamiento ininterrumpido o libre de errores. Podemos
              realizar mantenciones, actualizaciones o cambios al servicio en cualquier
              momento, incluyendo la interrupción de funciones si dependemos de un proveedor
              externo (por ejemplo, envío de correos o procesamiento de pagos) que presente
              fallas fuera de nuestro control.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">7. Limitación de responsabilidad</h2>
            <p>
              Tú Agenda se entrega &quot;tal cual&quot;. En la medida permitida por la ley, no
              somos responsables por pérdidas indirectas, lucro cesante, o daños derivados del
              uso o la imposibilidad de uso de la plataforma, incluyendo citas no confirmadas
              por fallas de un proveedor externo de correo o pagos.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">8. Cambios a estos términos</h2>
            <p>
              Podemos actualizar estos Términos de Servicio ocasionalmente. Si el cambio es
              significativo, te avisaremos por correo o dentro del panel. El uso continuado de
              la plataforma después de un cambio implica tu aceptación de los nuevos términos.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">9. Ley aplicable</h2>
            <p>
              Estos términos se rigen por las leyes de la República de Chile. Cualquier
              controversia se someterá a los tribunales ordinarios de justicia de Chile.
            </p>
          </section>

          <section>
            <h2 className="font-display font-semibold text-xl mb-2">10. Contacto</h2>
            <p>
              ¿Dudas sobre estos términos? Escríbenos a{" "}
              <a href="mailto:equipo.aimadigital@gmail.com" className="underline text-brand">
                equipo.aimadigital@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
