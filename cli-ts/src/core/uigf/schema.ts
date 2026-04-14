import Ajv from 'ajv'
import Ajv2020 from 'ajv/dist/2020.js'
import uigf30Schema from '../../schema/uigf3_0.json' with { type: 'json' }
import uigf41Schema from '../../schema/uigf4_1.json' with { type: 'json' }
import localSchema from '../../schema/local-data.json' with { type: 'json' }

const ajv = new Ajv({ strict: false })
const ajv2020 = new Ajv2020({ strict: false })

export const validateUigf30 = ajv.compile(uigf30Schema)
export const validateLocal = ajv.compile(localSchema)
export const validateUigf41 = ajv2020.compile(uigf41Schema)
