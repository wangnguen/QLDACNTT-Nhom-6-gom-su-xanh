import bcrypt from 'bcrypt'

import { SALT_ROUNDS } from '@common/constants'

export const hashPassword = (plain: string) => bcrypt.hash(plain, SALT_ROUNDS)
