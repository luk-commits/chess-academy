rm backend/app/Models/UserModel.php -f
docker compose run --rm backend phalcon model UserModel --name=users --config=app/Config/config.devtools.php --namespace=ChessAcademy\\Models --output=app/Models --force
sed -i '0,/\\Phalcon\\Mvc\\Model/s//AbstractModel/' backend/app/models/UserModel.php