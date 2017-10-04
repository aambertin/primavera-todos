const _schemaObject = { type: 'object', additionalProperties: false }
function SchemaObject(properties, required = false) {
	const merged = Object.assign(_schemaObject, {properties})
	if (!!required) merged.required = true

	return merged
}

export const GetTodo 			= SchemaObject({ id: { type:'string', required: true }})
export const CreateUpdateTodo 	= SchemaObject({
	_id: { type:'string', required:false },
	title: { type:'string', required:true },
	text: { type: 'string', required: false },
	done: { type: 'bool', required: false }
})