import {Router} from 'express'
import { registerUser } from '../controllers/user.conttroller.js'

const router = Router()

router.route("/register").post(registerUser) // for register post api

export default router