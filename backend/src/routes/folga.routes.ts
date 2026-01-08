import { Router } from 'express';
import * as folgaController from '../controllers/folga.controller';

const router = Router();

router.get('/', folgaController.getFolgas);
router.post('/', folgaController.createFolga);
router.delete('/:id', folgaController.deleteFolga);

export default router;