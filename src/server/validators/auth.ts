import { z } from "zod";

export const registerSchema = z.object({
  businessName: z.string().min(2, "Informe o nome do negocio."),
  name: z.string().min(2, "Informe seu nome."),
  email: z.string().email("Email invalido."),
  password: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
});
