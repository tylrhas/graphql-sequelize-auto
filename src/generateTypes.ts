import { GraphQLObjectType, GraphQLList } from 'graphql';
const resolver = require('./resolver')
const attributeFields = require('./attributeFields')
class GraphQlTypeBuilder {
  constructor(models, modelNames, excludeFields){
    this.models = models
    this.modelNames = modelNames
    this.types = {}
    this.excludeFields = excludeFields
    this.multipleRelationships = [
      'HasMany',
      'BelongsToMany'
    ]
  }
buildModelTypes(){
  this.modelNames.forEach(name => {
      this.buildModelType(this.models[name])
  })
  return this.types
}
buildModelType(model) {
  const {name, associations} = model
  const additionalFields = {}
    Object.keys(associations).forEach(key => {
      console.log(key)
      const associatedModel = model.associations[key]
      const {associationType} = associatedModel
      if (this.modelHasAssociations(key) && !this.typeHasCreated(key)) {
        this.buildModelType(this.models[key])
      }
      // const {name: fieldName, resolve, type } = this.buildAssociatedModelType(key, associationType, model)
      additionalFields[key] = this.buildAssociatedModelType(key, associationType, model)
      additionalFields[key] = {
        resolve: resolver(model[key]), 
        type: this.types[key]
      }
    });
    if ( !this.typeHasCreated(name)) {
    this.types[name] = this.createObjectType(model, additionalFields)
    }
}

typeHasCreated(typeName) {
  return this.types[typeName] || null
}

modelHasAssociations(modelName) {
  return (Object.keys(this.models[modelName].associations.length > 0))
}

buildAssociatedModelType(key, associationType, model) {
  return {
    resolve: resolver(model[key]), 
    type: this.isMultipleRelationship(associationType) ? new GraphQLList(this.types[key]) : this.types[key]
  }
}
isMultipleRelationship(associationType) {
  return this.multipleRelationships.includes(associationType)
}
createObjectType(model, additionalFields = {}) {
  console.log(model.name)
  let exclude = this.excludeFields[model.name] || [];
  const params = {
    name: `${model.name}Type`,
    description: `A ${model.name}`,
    fields: {
      ...attributeFields(model, {exclude}),
      ...additionalFields
  }
}
  return new GraphQLObjectType(params)
}
}

export default GraphQlTypeBuilder