import express, { Router } from 'express';
import controller from '../controllers/server-status';

const router = express.Router();

router.get('/ping', controller.serverStatusCheck);

export default { router };
