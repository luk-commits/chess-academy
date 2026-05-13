#!/bin/bash

generate_model() {
    local TABLE=$1
    local CLASS=$2
    local NAMESPACE="ChessAcademy\\Models"
    local OUTPUT="app/Models"
    local CONFIG="app/Config/config.devtools.php"

    echo "=== Generating model for table: $TABLE (class: ${CLASS}Model) ==="

    rm -f "backend/${OUTPUT}/${CLASS}Model.php"

    docker compose run --rm backend phalcon model "${CLASS}Model" \
        --name="$TABLE" \
        --config="$CONFIG" \
        --namespace="$NAMESPACE" \
        --output="$OUTPUT" \
        --force

    sed -i '0,/\\Phalcon\\Mvc\\Model/s//AbstractModel/' "backend/${OUTPUT}/${CLASS}Model.php"

    # Remove auto-generated relationships referencing renamed models
    sed -i "/GroupPlayers\|'Groups'\|coach_id.*'Users'/d" "backend/${OUTPUT}/${CLASS}Model.php"

    if [ ! -f "backend/${OUTPUT}/${CLASS}.php" ]; then
        echo "Creating ${CLASS}.php..."
        cat > "backend/${OUTPUT}/${CLASS}.php" << EOF
<?php

declare(strict_types=1);

namespace ChessAcademy\Models;

class ${CLASS} extends ${CLASS}Model
{
}
EOF
    else
        echo "${CLASS}.php already exists, skipping..."
    fi
}

generate_model "users" "User"
generate_model "positions" "Position"
generate_model "pgn_games" "PgnGame"
generate_model "refresh_tokens" "RefreshToken"
generate_model "groups" "Group"
