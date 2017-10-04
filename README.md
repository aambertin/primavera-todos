# Primavera TODO's
A very simple todo backend API to showcase the simplicity of setting your primavera project.

## Starting point:
You can find the primavera initialization in src/app.jsr
Checkout specifically the following code:

```javascript
primavera.loader.load(/services\.js$/, __dirname)
primavera.loader.load(/middleware\.js$/, __dirname)
primavera.loader.load(/endpoints\.js$/, __dirname)
primavera.web.start(router)
```

Being based in express, and to allow you to have a tighter control of what's going on, ORDER IS IMPORTANT.
As a general guideline you want to load all your "internal" services before you load your middleware and endpoints (those decorated with @Middleware and @Controller specifically).

The files must be "pre-loaded" to be part of primavera/flow internal router.



## Annotated models
Annotated Mongoose models are courtesy of mongoose-model-decorators package, and are not part of primavera.
Let's have a look at our Todo model
```javascript
export function DocOnly(data) {
    if (Array.isArray(data)) {
        return data
    }

    return data && data.toObject && data.toObject() || data
}
```
The DocOnly function sits there as part of a model transformer (to be used in services with @Transform.OUT). We are using this generic transformer to get rid of the mongoose model object and access just the contained document before sending a response from a @Resolve based service.

The idea is that you could later "hack" into the primavera/flow options to support functions in distributed environments when you decide to make your move into micro-services.

The @Model declaration is just conforming to mongoose-model-decorators. Go have a look at that package.
Primavera does not depend on it, so it's up to you if you want to use it or not.

```javascript
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
```

## Primavera/flow message resolvers
Within `todos.services.js` you will find the class containing our message resolvers.

The idea behind message resolvers is to abstract who takes care of what, setting you free from knowing http endpoints, internal api's and dependency management hell. With primavera/flow you can just say "i need this resolved" and let primavera/flow find out who should take care of it.

Let's have a look at the basic message-resolver format.
```javascript
// todos.services.js
class TodoManagementServices {
    
    // ...

    @Resolve({domain:'Todo', action: 'Get'})
    @Transform.OUT(DocOnly)
    async fetchTodo(query) {
        return await Todo.findOne(query)
    }

    // ...
}
```

When the `todos.services.js` file loads, so do the resolvers declared in it through the @Resolver decorator.
You have several ways to request a resolution on a message, by using ResolveWith.resolver(pattern) to find a resolver and invoke it, or by having methods annotated with @ResolveWith.

Let's see few examples from `todos.endpoints.js`


```javascript
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
```

The method createTodo of TodoEndpoints class is accessing the resolver programatically.
ResolveWith.resolver(pattern) uses the specified pattern to find a resolver, and returns the resolver function.

In this scenario, you must take care of the pattern fully matching a resolvable pattern.
For more complex scenarios, too keep your code cleaner, it is recomended that you use @ResolveWith.

@ResolveWith allows you to modify the message (make the transformations you need so you don't have to do it in your endpoints and get to keep your business logic cleaner), and also the pattern (potentially based on the message itself).

```javascript
    @ResolveWith({domain:'Todo'})
    async $getTodo(message, pattern) {
        // pattern can only be modified inline and not hard-replaced
        pattern.action = 'Get'
        return message
    }
```

This method, when invoked, will alter the pattern that primavera/flow will use to try and find a resolver.
Based on the message or any other conditions, you could redirect to different services/functions in a very simple way.



## Endpoints, routing and validations
Support for middleware and routing is based on express (but any express router-like interface that you initialize it with will do).

Making use of decorators and some utility functions you can easily write very expressive, class-contained, unexposed (in terms of module.exports) endpoints. This helps keep your code clean and pretty:

```javascript
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
```

In this example, you can specify which HttpStatus will be used on success, throw HttpError's in a very expressive and simple way, define a PATCH route with parameters, and validate both the request parameters and the payload using @ValidateSchema.

@ValidateSchema uses jsonschema behind the scenes, so configuring your schemas is business as usual.
If @ValidateSchema fails, a BAD_REQUEST http error is returned with the jsonschema errors as the response body.


## We're done for today!
Happy hacking.
