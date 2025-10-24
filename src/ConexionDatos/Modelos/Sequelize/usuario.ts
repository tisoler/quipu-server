import { Model, DataTypes, InferAttributes, InferCreationAttributes, CreationOptional, Sequelize } from 'sequelize';

export class Usuario extends Model<
  InferAttributes<Usuario>,
  InferCreationAttributes<Usuario>
> {
  declare id: CreationOptional<number>;
  declare usuario: string;
  declare password: string;
}

export const initUsuario = async (sequelize: Sequelize) => {
  Usuario.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      usuario: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      sequelize,
      tableName: 'usuario',
      timestamps: false,
    }
  );
};
