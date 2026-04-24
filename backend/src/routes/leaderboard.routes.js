import { Router } from 'express'
import { authenticate } from '../middlewares/auth.middleware.js'
import { getLeaderboard } from '../controllers/leaderboard.controller.js'

const router = Router()
router.get('/', authenticate, getLeaderboard)
export default router
