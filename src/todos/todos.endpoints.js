const debug = require('debug')('api:todos')

import { Route, Controller, Middleware, Context, Session, HttpStatus, HttpError } from 'primavera/web'
import { RequiresAuth, RequiresRole } from 'primavera/web-security'
import { PropertySources, Property } from 'primavera/core'
import { ValidateSchema } from 'primavera/validations'
import { Transform } from 'primavera/transform'
import { ResolveWith } from 'primavera/flow'
import * as S from './todos.schemas'
import _ from 'lodash'


@Middleware({prefix:'todos'})
class TodoMiddleware {

	@Context('$response')
	get $response() {}

	@Context('$request')
	get $request() {}

	@Session()
	get $session() {}

	@Route.USE('')
	useContextDecorators() {
		const res = this.$response
		const req = this.$request
		const origin = req.headers.origin
		debug(`${req.method} ${req.path}`)
	}
}

/**
 * Transform.OUT function.
 * target parameter allows to access class members from the transformer.
 * @param {Todo} todo todo to be transformed
 */
async function RequestInfo(todo, target) {
	const transformed = _.assign({}, todo)
	transformed.$timestamp = `${target.timestamp}`
	transformed.$session = `${target.$session.id}`

	debug(`Returning transformed todo after RequestTimestamp transformer`, transformed)
	return transformed
}



@PropertySources(process.env)
@Controller({prefix:'todos'})
class TodoEndpoints {

	@Session()
	get $session() {}

	get timestamp() {
		return Date.now()
	}

	@HttpStatus(HttpStatus.CREATED)
	@Route.POST('')
	@ValidateSchema({}, S.CreateUpdateTodo)
	@Transform.OUT(RequestInfo)
	async createTodo(params, payload) {
		debug(`Creating todo`, payload)
		let todo = new Object
		Object.assign(todo, payload)

		todo._session = this.$session.id
		// Invoking message resolver directly
		todo = await ResolveWith.resolver({domain:'Todo', action:'Save'})(todo)
		
		return todo
	}


	@Route.GET('')
	async listTodos() {

		// invoking message resolver with @ResolveWith
		return this.$getTodoList()
	}


	// validate that ID is present
	@ValidateSchema(S.RetrieveTodo)
	@Transform.OUT(RequestInfo)
	@Route.GET(':id')
	async fetchSpecificTodo(params) {
		const _id = params.id
		const _session = this.$session.id

		// use @ResolveWith with pattern transformation
		return this.$getTodo({_id, _session})
	}


	@HttpStatus(HttpStatus.OK)
	@ValidateSchema(S.GetTodo, S.CreateUpdateTodo)
	@Route.PATCH(':id')
	async updateTodo(params, payload = {}) {
		payload._session = this.$session.id
		payload._id = params.id

		try {
			return await ResolveWith.resolver({domain:'Todo', action:'Save'})(payload)
		}
		catch (err) {
			console.log(err)
			throw HttpError.serverError(`Something went wrong updating your todo: ${err.message}`)
		}
	}


	@ResolveWith({domain:'Todo', action:'GetList'})
	async $getTodoList(message = {}) {
		// transform the message
		const id = this.$session.id
		message._session = id
		return message
	}


	@ResolveWith({domain:'Todo'})
	async $getTodo(message, pattern) {
		// pattern can only be modified inline and not hard-replaced
		pattern.action = 'Get'
		return message
	}


}