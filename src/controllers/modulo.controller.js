
import { getCurrent, moveToNext } from "../services/modulo.service.js";

export async function getCurrentModule(req, res) {
  try {
    const contentId = req.query.id;
    const userId = req.query.userId;

    const resultado = await getCurrent(contentId, userId);

    return res.status(200).json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}

export async function moveToNextModule(req, res) {
   try {
    const contentId = req.query.id;
    const userId = req.query.userId;

    const resultado = await moveToNext(contentId, userId);

    return res.status(201).json(resultado);
  } catch (error) {
    return res.status(400).json({ error: error.message });
  }
}