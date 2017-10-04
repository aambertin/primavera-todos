const debug = require('debug')('api:todos/models')

import { Model, pre } from 'mongoose-model-decorators'
import shortid from 'shortid'

export function DocOnly(data) {
	if (Array.isArray(data)) {
		return data
	}

	return data && data.toObject && data.toObject() || data
}

@Model
export class Todo {
	static get schema() {
		return {
			_id: { type: String, hashKey: true, default: shortid, required: true },
			_session: String,
			title: String,
			text: String,
			done: Boolean,
			_updatedAt: Number
		}
	}

	@pre('save')
	preSave() {
		if (!this.isNew) //:
			this._updatedAt = Date.now()
		
	}
}
