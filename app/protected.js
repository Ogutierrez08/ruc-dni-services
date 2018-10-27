// const express = require('express')
// const jwt = require('express-jwt')
// const config = require('../config.json')

// const Items = require('./appRoutes/Items')
// const User = require('./appRoutes/User')
// const UserAdmin = require('./appRoutes/UserAdmin')
// const Structures = require('./appRoutes/Structures')

// const Supervisor = require('./appRoutes/Supervisor')

// const app = module.exports = express.Router()

// const jwtCheck = jwt({
//   secret: config.secret
// })

// const jwtCheckCli = jwt({
//   secret: config.apiSecret
// })

// app.use('/api/protected', jwtCheck)
// app.use('/api/protectedcli', jwtCheckCli)

// // Done
// app.get('/api/protected/getItems', Items.getItems)
// app.post('/api/protected/registerView', Items.registerView)
// app.post('/api/protected/editItem', Items.editItem)

// app.post('/api/protected/hideItem', Items.hideItem)
// app.post('/api/protected/unHideItem', Items.unHideItem)
// app.post('/api/protected/removeItem', Items.removeItem)
// app.post('/api/protected/moveItem', Items.moveItem)
// app.post('/api/protected/addItem', Items.addItem)
// app.post('/api/protected/setFavorite', Items.setFavorite)

// app.post('/api/protected/updateUserInfo', User.updateUserInfo)
// app.post('/api/protected/updateUserPassword', User.updateUserPassword)

// app.get('/api/protected/admin/getUsers', UserAdmin.getUsers)
// app.post('/api/protected/admin/getSubscriptions', UserAdmin.getSubscriptions)
// app.get('/api/protected/admin/getFoldersSubscriptions', UserAdmin.getFoldersSubscriptions)
// app.post('/api/protected/admin/updateSubscriptions', UserAdmin.updateSubscriptions)
// app.post('/api/protected/admin/updateUserInfo', UserAdmin.updateUserInfo)
// app.post('/api/protected/admin/updateUserPassword', UserAdmin.updateUserPassword)
// app.post('/api/protected/admin/updateAccessLevel', UserAdmin.updateAccessLevel)
// app.post('/api/protected/admin/createUser', UserAdmin.createUser)

// app.post('/api/protected/structures/createStructure', Structures.createStructure)
// app.post('/api/protected/structures/checkStructureName', Structures.checkStructureName)
// app.post('/api/protected/structures/getStructures', Structures.getStructures)
// app.post('/api/protected/structures/buildStructure', Structures.buildStructure)
// app.post('/api/protected/structures/createHeritableItem', Structures.createHeritableItem)
// app.post('/api/protected/structures/updateHeritableItem', Structures.updateHeritableItem)
// app.post('/api/protected/structures/createHeritableStructure', Structures.createHeritableStructure)
// app.post('/api/protected/structures/replicateStructure', Structures.replicateStructure)
// app.post('/api/protected/structures/removeStructure', Structures.removeStructure)
// app.post('/api/protected/structures/updateSpecificItemData', Structures.updateSpecificItemData)
// app.post('/api/protected/structures/replicateFolder', Structures.replicateFolder)
// app.post('/api/protected/structures/updateMultipleItemsInheritee', Structures.updateMultipleItemsInheritee)
// app.post('/api/protected/unDoRemoveItem', Items.unDoRemoveItem)
// app.post('/api/protected/getHeritableItems', Items.getHeritableItems)

// // test
// app.get('/api/protected/supervisor/getFiles', Supervisor.getFiles)
// app.post('/api/protected/supervisor/updateFile', Supervisor.updateFile)
// app.post('/api/protected/supervisor/removeFile', Supervisor.removeFile)
// app.post('/api/protected/supervisor/addDistributor', Supervisor.addDistributor)
// app.post('/api/protected/supervisor/editDistributor', Supervisor.editDistributor)
// app.post('/api/protected/supervisor/removeDistributor', Supervisor.removeDistributor)
// app.post('/api/protectedcli/supervisor/addConsistencyLog', Supervisor.addConsistencyLog)
// app.post('/api/protectedcli/supervisor/getDistributorNameByCode2', Supervisor.getDistributorNameByCode2)
// app.get('/api/protected/supervisor/getCards', Supervisor.getCards)
// app.post('/api/protected/supervisor/updateCards', Supervisor.updateCards)
// app.post('/api/protected/supervisor/sendInconsistenciesMail', Supervisor.sendInconsistenciesMail)
// // app.post('/api/protected/supervisor/getConsistencylogByCode2', Supervisor.getConsistencylogByCode2)

// app.post('/api/protectedcli/supervisor/addSalesMaxDates', Supervisor.addSalesMaxDates)
// app.post('/api/protected/supervisor/getConsistencyLogByCode2', Supervisor.getConsistencyLogByCode2)
// app.post('/api/protected/supervisor/getMaxDatesByCode1', Supervisor.getMaxDatesByCode1)

// // Client endpoints
// app.post('/api/protectedcli/supervisor/insertInconsistenciesStateData', Supervisor.insertInconsistenciesStateData)
