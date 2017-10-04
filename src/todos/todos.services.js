const debug = require('debug')('api:todos/services')

import { Resolve, ResolveWith } from 'primavera/flow'
import { Transform } from 'primavera/transform'
import { Todo, DocOnly } from './todos.models'
import querystring from 'querystring'
import shortid from 'shortid'
import _ from 'lodash'

export default {'message': 'Use only through primavera/flow'}


class TodoManagementServices {

	@Resolve({domain: 'Todo', action: 'Save'})
	@Transform.OUT(DocOnly)
	async saveTodo (todoinfo) {
		let todo

		if (todoinfo._id) {
			todo = await Todo.findOne({_id:todoinfo._id})
			if (todo._session != todoinfo._session) {//:
				debug(`Unmatching todos for update`, todo, todoinfo)
				throw new Error('Forbidden') //  not your todo!
			}

			Object.assign(todo, todoinfo)
		}
		else {
			todo = new Todo(todoinfo)	
		}

		return await todo.save()
	}

	@Resolve({domain:'Todo', action: 'Get'})
	@Transform.OUT(DocOnly)
	async fetchTodo(query) {
		return await Todo.findOne(query)
	}

	@Resolve({domain:'Todo', action: 'GetList'})
	// @Transform.OUT(DocOnly)
	async listTodos(query) {
		return await Todo.find(query)
	}

}
