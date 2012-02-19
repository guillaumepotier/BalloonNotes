<?php

switch($_SERVER['REQUEST_METHOD'])
{
    case 'POST':
        save();
    break;
    case 'GET':
        fetch();
    break;
    case 'PUT':
        save();
    break;
    case 'DELETE':
        destroy();
    break;
    default: 
        return false; 
    break;
}

/**
 * Save model.
**/
function save() 
{
    $values = json_decode(file_get_contents('php://input'), true);
    $handle = fopen($values[id].".json","w");
    fwrite($handle, json_encode($values));
    fclose($handle);
}

/**
* Fetch model.
**/
function fetch() 
{
    $jsonFile = $_GET['id'].".json";
    $fh = fopen($jsonFile, 'r');
    $jsonData = fread($fh, filesize($jsonFile));
    fclose($fh);
    echo $jsonData;
}

/**
* Destroy model.
**/
function destroy() 
{
    $jsonFile = $_GET['id'].".json";
    unlink($jsonFile);
}