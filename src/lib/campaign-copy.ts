/** Variable que el negocio puede escribir a mano en el mensaje de una campaña. */
export const CLIENT_NAME_VAR = "{{Nombre Cliente}}";

/**
 * Aplica el nombre del cliente al mensaje. Si el negocio escribió la
 * variable a mano, la reemplaza donde esté. Si no la escribió pero
 * tenemos el nombre real del cliente, igual saluda con su nombre al
 * principio — ya que tenemos el dato, no tiene sentido no usarlo.
 */
export function personalizeCampaignBody(body: string, name: string | null): string {
  const displayName = name?.trim() || "";
  if (body.includes(CLIENT_NAME_VAR)) {
    return body.replaceAll(CLIENT_NAME_VAR, displayName || "cliente");
  }
  return displayName ? `Hola ${displayName},\n\n${body}` : body;
}
