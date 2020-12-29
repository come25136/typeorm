import { ObjectLiteral } from "../../common/ObjectLiteral";
import { Connection } from "../../connection/Connection";
import { MysqlDriver } from "../mysql/MysqlDriver";
import { EntityMetadata } from "../../metadata/EntityMetadata";
import { OrmUtils } from "../../util/OrmUtils";

export class MariaDBDriver extends MysqlDriver {
  constructor(connection: Connection) {
    super(connection)
  }

  /**
   * Creates generated map of values generated or returned by database after INSERT query.
   */
  createGeneratedMap(metadata: EntityMetadata, insertResult: any, entityIndex: number) {
    if (typeof insertResult === 'object') {
      return Object.keys(insertResult).reduce((map, key) => {
        const column = metadata.findColumnWithDatabaseName(key);
        if (column) {
          OrmUtils.mergeDeep(map, column.createValueMap(insertResult[key]));
          // OrmUtils.mergeDeep(map, column.createValueMap(this.prepareHydratedValue(insertResult[key], column))); // TODO: probably should be like there, but fails on enums, fix later
        }
        return map;
      }, {} as ObjectLiteral);
    }

    const generatedMap = metadata.generatedColumns.reduce((map, generatedColumn) => {
      let value: any;
      if (generatedColumn.generationStrategy === "increment" && insertResult.insertId) {
        // NOTE: When multiple rows is inserted by a single INSERT statement,
        // `insertId` is the value generated for the first inserted row only.
        value = insertResult.insertId + entityIndex;
        // } else if (generatedColumn.generationStrategy === "uuid") {
        //     console.log("getting db value:", generatedColumn.databaseName);
        //     value = generatedColumn.getEntityValue(uuidMap);
      }

      return OrmUtils.mergeDeep(map, generatedColumn.createValueMap(value));
    }, {} as ObjectLiteral);

    return Object.keys(generatedMap).length > 0 ? generatedMap : undefined;
  }

  /**
    * Returns true if driver supports RETURNING / OUTPUT statement.
    */
  isReturningSqlSupported(): boolean {
    return true;
  }
}
