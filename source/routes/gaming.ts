import express, { Router } from 'express';
import controller from '../controllers/gaming';

const grouter = express.Router();

grouter.get('/now', controller.serverCurrentTimeStamp);

grouter.post('/register', controller.register);

grouter.get('/me', controller.me);

grouter.post('/game/play', controller.gamePlay);

grouter.post('/game/claim_bonus', controller.gameClaimBonus);
///leaderboard
grouter.get('/leaderboard', controller.leaderBoard);

export default { grouter };
