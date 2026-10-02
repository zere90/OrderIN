export function whatsappPayload(
  account = "test-phone",
  id = "wamid.qazyna-test",
  now = Date.now(),
) {
  return {
    object: "whatsapp_business_account",
    entry: [{
      id: "test-waba",
      changes: [{
        field: "messages",
        value: {
          messaging_product: "whatsapp",
          metadata: {
            display_phone_number: "15550000000",
            phone_number_id: account,
          },
          contacts: [{
            wa_id: "77000000001",
            profile: { name: "Тестовый клиент" },
          }],
          messages: [{
            from: "77000000001",
            id,
            timestamp: String(Math.floor(now / 1000)),
            type: "text",
            text: { body: "Сәлем! Ертең екі латте керек, мекенжай: Абай 10" },
          }],
        },
      }],
    }],
  };
}
export function instagramPayload(
  account = "test-instagram",
  id = "mid.qazyna-test",
  now = Date.now(),
) {
  return {
    object: "instagram",
    entry: [{
      id: account,
      time: now,
      messaging: [{
        sender: { id: "test-customer" },
        recipient: { id: account },
        timestamp: now,
        message: { mid: id, text: "Hi! Two lattes tomorrow, please." },
      }],
    }],
  };
}
