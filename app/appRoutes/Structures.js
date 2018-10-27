const pool = require('../utils/pool')

module.exports = {
  getStructures (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }
    pool.executeQuery({
      data: [],
      query: 'CALL getStructures()',
      description: `Getting structures`,
      res,
      onSuccess: (result) => {
        const rows = result[0].map(item => item)
        const max = rows.length
        let resultSet = []
        let structureKeys = {}

        // Getting structureKeys
        for (let i = 0; i < max; i++) {
          const r = rows[i]
          if (structureKeys[r.structureID] === undefined) {
            structureKeys[r.structureID] = {}
          } else {
            continue
          }
          structureKeys[r.structureID] = {
            structureID: r.structureID,
            structureName: r.structureName,
            folderName: r.folderName,
            heritable: r.heritable,
            structureItems: []
          }
        }

        // Filling structureKeys
        for (let i = 0; i < max; i++) {
          const r = rows[i]
          structureKeys[r.structureID].structureItems.push({
            structureItemID: r.structureItemID,
            folderName: r.folderName,
            itemName: r.itemName,
            description: r.description,
            labels: r.labels,
            imageUrl: r.imageUrl,
            isFolder: r.isFolder
          })
        }

        // converting to json
        resultSet = Object.keys(structureKeys).map(k => structureKeys[k])
        // output json
        res.status(200).send({status: '1', message: 'OK', rows: resultSet})
      }
    })
  },
  checkStructureName (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const structureName = req.body.structureName ? req.body.structureName : ''
    pool.executeQuery({
      data: [structureName],
      query: 'CALL checkStructureName(?)',
      description: `Checking if the structure "${structureName}" exists`,
      res,
      onSuccess: (result) => {
        const exists = result[0].length > 0 ? 1 : 0
        res.status(200).send({status: '1', message: 'OK', exists})
      }
    })
  },
  createStructure (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const structureName = req.body.structureName ? req.body.structureName : ''
    const folderName = req.body.folderName ? req.body.folderName : ''
    const structureItems = req.body.structureItems ? req.body.structureItems : ''

    if (structureName === '' || folderName === '' || structureItems === '') {
      res.status(412).send({status: '0', message: 'Fields [structureName, folderName, structureItems] are mandatories'})
      return
    }

    if (!Array.isArray(structureItems)) {
      res.status(412).send({status: '0', message: 'Field [structureItems] should be array'})
      return
    }

    pool.executeQuery({
      data: [structureName, folderName],
      query: 'CALL createStructure(?, ?)',
      description: `Trying to insert the structure: ${structureName}`,
      res,
      onSuccess: (result) => {
        // TODO: VALIDAR VALORES DUPLICADOS
        insertStructureItems(result[0][0]['structureID'], structureItems)
        // res.status(200).send({status: '1', message: 'OK', rows: result[0]})
      }
    })

    const insertStructureItems = (structureID, items) => {
      let query = `
        INSERT INTO structureItems
          (structureID, itemName, description, labels, imageUrl)
        VALUES
      `
      const max = items.length
      for (let i = 0; i < max - 1; i++) {
        const item = items[i]
        query += `(${structureID}, '${item.itemName}', '${item.description}', '${item.labels}', '${item.imageUrl}'), `
      }
      const lastItem = items[max - 1]
      query += `(${structureID}, '${lastItem.itemName}', '${lastItem.description}', '${lastItem.labels}', '${lastItem.imageUrl}')`

      // console.log('structureID', structureID)
      // console.log('query', query)
      pool.executeQuery({
        data: [],
        query,
        description: `Trying to insert (${items.length}) structure items`,
        res,
        onSuccess: (result) => {
          res.status(200).send({status: '1', message: 'OK', rows: result[0]})
        }
      })
    }
  },
  buildStructure (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const itemName = req.body.folderName ? req.body.folderName : ''
    const containedBy = req.body.containedBy ? req.body.containedBy : ''
    const items = req.body.items ? req.body.items : ''
    const isHidden = 'hideFolder' in req.body ? req.body.hideFolder : ''

    if (itemName === '' || containedBy === '' || items === '' || isHidden === '') {
      res.status(412).send({status: '0', message: 'Fields [itemName, containedBy, items, isHidden] are mandatories'})
      return
    }

    if (!Array.isArray(items)) {
      res.status(412).send({status: '0', message: 'Field [items] should be array'})
      return
    }

    if ([1, 0, '1', '0', true, false].indexOf(isHidden) === -1) {
      res.status(412).send({status: '0', message: 'Field [hideFolder] should be boolean'})
      return
    }

    pool.getConnection({
      res,
      description: 'Getting connection for building a structure',
      onSuccess: (connection) => {
        connection.beginTransaction((errTransaction) => {
          if (errTransaction) {
            res.status(503).send({
              status: '-1',
              message: `Error connecting to database when [Rolling back after trying create folder]`,
              fatal: errTransaction.fatal,
              code: errTransaction.code,
              sqlMessage: errTransaction.sqlMessage
            })
            return
          }
          /*
          _userID,_containedBy, _itemName, _isFolder,
          _url1, _url2, _url3, _url4, _url5,
          _imageUrl, _description, _labels, _isHidden, _returnResult
          */
          connection.query('CALL addItem(?, ?, ?, ?,   ?, ?, ?, ?, ?,   ?, ?, ?, ?, ?)', [
            req.user.userID, containedBy, itemName, true,
            '', '', '', '', '',
            '', '', '', isHidden, false
          ], (errorCreateFolder, results, fields) => {
            if (errorCreateFolder) {
              return connection.rollback(() => {
                res.status(503).send({
                  status: '-1',
                  message: 'Error connecting to database when [Rolling back after trying create folder]',
                  fatal: errorCreateFolder.fatal,
                  code: errorCreateFolder.code,
                  sqlMessage: errorCreateFolder.sqlMessage
                })
              })
            }

            const folderID = results[0][0]['itemID']

            let query = ''
            const max = items.length
            for (let i = 0; i < max; i++) {
              const item = items[i]
              query += `CALL addItem(
                '${req.user.userID}', '${folderID}', '${item.itemName}', 0,
                '', '', '', '', '',
                '${item.imageUrl}', '${item.description}', '${item.labels}', null, 0);`
            }

            connection.query(query, [], (errorCreateItems, results, fields) => {
              if (errorCreateItems) {
                return connection.rollback(() => {
                  res.status(503).send({
                    status: '-1',
                    message: `Error adding items to structure when [Rolling back after trying create items]`,
                    fatal: errorCreateItems.fatal,
                    code: errorCreateItems.code,
                    sqlMessage: errorCreateItems.sqlMessage
                  })
                })
              }
              connection.commit((errorCommit) => {
                if (errorCommit) {
                  return connection.rollback(() => {
                    res.status(503).send({
                      status: '-1',
                      message: `Error adding items to structure when [Commiting after trying create items]`,
                      fatal: errorCommit.fatal,
                      code: errorCommit.code,
                      sqlMessage: errorCommit.sqlMessage
                    })
                  })
                }

                pool.executeQuery({
                  data: [folderID],
                  query: 'CALL getItems_built(?)',
                  description: 'Getting new items',
                  res,
                  onSuccess: (result) => {
                    res.status(200).send({status: '1', rows: result[0], message: 'ok', folderID})
                  }
                })
              })
            })
          })
        })
      }
    })
  },
  createHeritableItem (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const structureID = String(req.body.structureID) ? req.body.structureID : ''
    const itemName = req.body.itemName ? req.body.itemName.trim() : ''
    const description = req.body.description ? req.body.description.trim() : ''
    const labels = req.body.labels ? req.body.labels.trim() : ''
    const imageUrl = req.body.imageUrl ? req.body.imageUrl.trim() : ''
    const isFolder = String(req.body.isFolder) ? req.body.isFolder : ''
    const containedBy = String(req.body.containedBy) ? req.body.containedBy : ''
    const structureItemInheritance = String(req.body.structureItemInheritance) ? req.body.structureItemInheritance : ''

    if (structureID === '' || itemName === '' || /* description === '' || labels === '' || imageUrl === '' || */ containedBy === '' || isFolder === '' || structureItemInheritance === '') {
      res.status(412).send({status: '0', message: 'Fields [itemName, description, labels, isFolder, containedBy, structureItemInheritance] are mandatories'})
      return
    }

    pool.getConnection({
      res,
      description: 'Getting connection for creating an inherited item',
      onSuccess: (connection) => {
        connection.beginTransaction((errTransaction) => {
          if (errTransaction) {
            res.status(503).send({
              status: '-1',
              message: `Error connecting to database when [Rolling back after trying to create an inherited item]`,
              fatal: errTransaction.fatal,
              code: errTransaction.code,
              sqlMessage: errTransaction.sqlMessage
            })
            return
          }

          let containedByInfo = /^(HI?)(\d+)$/.exec(containedBy)
          let _containedBy = containedByInfo[1] === 'H' && containedByInfo[2] === String(structureID) ? '0' : containedByInfo[2]
          // Crear structureItem
          connection.query('CALL admin_createStructureItem(?, ?, ?, ?, ?, ?, ?)', [
            structureID, itemName, description, labels, imageUrl, isFolder, _containedBy
          ], (errorCreateStructureItem, result1) => {
            if (errorCreateStructureItem) {
              return connection.rollback(() => {
                res.status(503).send({
                  status: '-1',
                  message: 'Error connecting to database when [Rolling back after trying to create a structureItem]',
                  fatal: errorCreateStructureItem.fatal,
                  code: errorCreateStructureItem.code,
                  sqlMessage: errorCreateStructureItem.sqlMessage
                })
              })
            }
            // console.log(JSON.stringify(result1[0][0], null, 2))

            // Crear items por carpeta que esté heredando
            let _containedBy = containedByInfo[2]
            // let _inherited = isFolder ? result1[0][0] && result1[0][0].inherited : 0
            let _inherited = result1[0][0] && result1[0][0].inherited
            // console.log(JSON.stringify(_inherited, null, 2))
            connection.query('CALL admin_createInheritedItems(?, ?, ?, ?, ?, ?, ?, ?, ?)', [
              itemName,
              isFolder,
              description,
              labels,
              imageUrl,
              _containedBy,
              req.user.userID,
              _inherited,
              structureItemInheritance
            ], (errorCreateItems, result2) => {
              if (errorCreateItems) {
                return connection.rollback(() => {
                  res.status(503).send({
                    status: '-1',
                    message: `Error adding items to structure when [Rolling back after trying to create items]`,
                    fatal: errorCreateItems.fatal,
                    code: errorCreateItems.code,
                    sqlMessage: errorCreateItems.sqlMessage
                  })
                })
              }

              // console.log(JSON.stringify(result2[0], null, 2))
              connection.commit((errorCommit) => {
                if (errorCommit) {
                  return connection.rollback(() => {
                    res.status(503).send({
                      status: '-1',
                      message: `Error adding items to structure when [Commiting after trying to create an inherited item]`,
                      fatal: errorCommit.fatal,
                      code: errorCommit.code,
                      sqlMessage: errorCommit.sqlMessage
                    })
                  })
                }

                res.status(200).send({status: '1', message: 'OK', items: result2[0]})

                // Si necesito traer cierta información de vuelta
                // Tal vez una actualización en el árbol de carpetas
                //  o en el de structures, si es que no se lo ha hecho
                //  (o no es posible, por falta de datos no calc.) en
                //  el lado del cliente
                /* pool.executeQuery({
                  data: [],
                  query: '',
                  description: '',
                  res,
                  onSuccess: () => {}
                }) */
              })
            })
          })
        })
      }
    })
  },
  updateHeritableItem (req, res) { // admin_updateInheritedItems
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const isParentRoot = req.body.isParentRoot
    const structureID = req.body.structureID ? req.body.structureID : ''
    const isFolder = req.body.isFolder
    const itemID = req.body.itemID ? req.body.itemID : ''
    const parentItemID = req.body.parentItemID ? req.body.parentItemID : ''
    const parentStructureItemInheritance = req.body.parentStructureItemInheritance
    const newItemName = req.body.newItemName ? req.body.newItemName.trim() : ''
    const newDescription = req.body.newDescription ? req.body.newDescription.trim() : ''
    const newLabels = req.body.newLabels ? req.body.newLabels.trim() : ''
    const newImageUrl = req.body.newImageUrl ? req.body.newImageUrl.trim() : ''
    const removed = req.body.removed

    if (/* isParentRoot === '' ||  */structureID === '' || itemID === '' || parentItemID === '' || /* parentStructureItemInheritance === '' || */ newItemName === ''/*  || newDescription === '' || newLabels === '' *//* || newImageUrl === '' || removed === '' */) {
      res.status(412).send({status: '0', message: 'Fields [structureID, itemID, parentItemID, newItemName] are mandatories'})
      return
    }

    pool.executeQuery({
      data: [
        isParentRoot, structureID, isFolder,
        itemID,
        parentItemID,
        parentStructureItemInheritance,
        newItemName, newDescription, newLabels, newImageUrl,
        removed
      ],
      query: 'CALL admin_updateInheritedItems(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      description: 'Updating an inherited item',
      res,
      onSuccess: (result) => {
        res.status(200).send({status: '1', message: 'OK'})
      }
    })
  },
  createHeritableStructure (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    // Validación
    const structureName = req.body.structureName ? req.body.structureName.trim() : ''

    if (structureName === '') {
      res.status(412).send({status: '0', message: 'Fields [structureName] are mandatories'})
      return
    }

    pool.executeQuery({
      data: [structureName],
      query: 'CALL admin_createHeritableStructure(?) ',
      description: 'Creating empty heritable structure',
      res,
      onSuccess: (result) => {
        res.status(200).send({status: '1', message: 'OK'})
      }
    })
  },
  replicateStructure (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const structureID = req.body.structureID ? req.body.structureID : ''
    const folderName = req.body.folderName ? req.body.folderName.trim() : ''
    const containedBy = req.body.containedBy ? req.body.containedBy : ''

    if (structureID === '' || folderName === '' || containedBy === '') {
      res.status(412).send({status: '0', message: 'Fields [structureID, folderName, containedBy] are mandatories'})
      return
    }

    pool.executeQuery({
      data: [
        structureID,
        folderName,
        containedBy,
        req.user.userID
      ],
      query: 'CALL admin_replicateStructure(?, ?, ?, ?)',
      description: 'Replicates a full structure tree within a folder',
      res,
      onSuccess: (result) => {
        res.status(200).send({status: '1', message: 'OK'})
      }
    })
  },
  removeStructure (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const structureID = req.body.structureID ? req.body.structureID : ''
    const structureItemInheritance = req.body.structureItemInheritance

    if (structureID === '' || structureItemInheritance === undefined) {
      res.status(412).send({status: '0', message: 'Fields [structureID, folderName] are mandatories'})
      return
    }

    pool.executeQuery({
      data: [
        structureID,
        structureItemInheritance
      ],
      query: 'CALL admin_removeInheritedItems(?, ?)',
      description: 'Removes a full structure tree and heritables',
      res,
      onSuccess: (result) => {
        res.status(200).send({status: '1', message: 'OK'})
      }
    })
  },
  updateSpecificItemData (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const items = req.body.items ? req.body.items : ''

    if (items === '') {
      res.status(412).send({status: '0', message: 'Fields [items] are mandatories'})
      return
    }

    if (!Array.isArray(items)) {
      res.status(412).send({status: '0', message: 'Field [items] should be array'})
      return
    }

    pool.getConnection({
      res,
      description: 'Getting connection to update specific items data',
      onSuccess: (connection) => {
        connection.beginTransaction((errTransaction) => {
          if (errTransaction) {
            res.status(503).send({
              status: '-1',
              message: `Error connecting to database when [Trying to update specific items data]`,
              fatal: errTransaction.fatal,
              code: errTransaction.code,
              sqlMessage: errTransaction.sqlMessage
            })
            return
          }

          let query = ''
          const max = items.length
          for (let i = 0; i < max; i++) {
            let item = items[i]
            query += `CALL admin_updateSpecificItemData(
              '${item.itemID}', '${item.url1}', '${item.url2}'
            );`
          }

          // console.log(query); res.status(200).send({status: '1', message: 'OK'}); return

          connection.query(query, [], (errorUpdateItem, result) => {
            if (errorUpdateItem) {
              return connection.rollback(() => {
                res.status(503).send({
                  status: '-1',
                  message: `Error updating items when [Updating specific items data]`,
                  fatal: errorUpdateItem.fatal,
                  code: errorUpdateItem.code,
                  sqlMessage: errorUpdateItem.sqlMessage
                })
              })
            }

            connection.commit((errorCommit) => {
              if (errorCommit) {
                return connection.rollback(() => {
                  res.status(503).send({
                    status: '-1',
                    message: `Error updating items when [Commiting after updating specific items data]`,
                    fatal: errorCommit.fatal,
                    code: errorCommit.code,
                    sqlMessage: errorCommit.sqlMessage
                  })
                })
              }

              res.status(200).send({status: '1', message: 'OK'})
            })
          })
        })
      }
    })
  },
  replicateFolder (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const itemID = req.body.itemID ? req.body.itemID : ''
    const originalName = req.body.originalName ? req.body.originalName.trim() : ''
    const folderName = req.body.folderName ? req.body.folderName.trim() : ''

    if (itemID === '' || originalName === '' || folderName === '') {
      res.status(412).send({status: '0', message: 'Fields [itemID, originalName, itemName] are mandatories'})
      return
    }

    pool.executeQuery({
      data: [itemID, originalName, folderName],
      query: 'CALL admin_replicateFolder(?, ?, ?)',
      description: 'Replicating existent folder into a structure tree',
      res,
      onSuccess: (result) => {
        res.status(200).send({status: '1', message: 'OK'})
      }
    })
  },
  updateMultipleItemsInheritee (req, res) {
    if (req.user.userType !== 'ADMIN') {
      res.status(401).send({status: '0', message: 'You have not enough permissions to do this'})
      return
    }

    const itemsID = req.body.itemsID ? req.body.itemsID : ''
    const inherited = req.body.inherited ? req.body.inherited : ''
    const structureItemInheritance = req.body.inherited ? req.body.structureItemInheritance : ''

    if (itemsID === '' || inherited === '' || structureItemInheritance === '') {
      res.status(412).send({status: '0', message: 'Fields [itemsID, inherited, structureItemInheritance] are mandatories'})
      return
    }

    if (!Array.isArray(itemsID)) {
      res.status(412).send({status: '0', message: 'Field [itemsID] should be array'})
      return
    }

    const _itemsID = itemsID.join(',')
    pool.executeQuery({
      data: [
        _itemsID,
        inherited,
        structureItemInheritance
      ],
      query: 'CALL admin_updateMultipleItemsInheritee(?, ?, ?)',
      description: 'Binding multiple nomal folders to a base folder',
      res,
      onSuccess: () => {
        res.status(200).send({status: '1', message: 'OK'})
      }
    })
  }
}
