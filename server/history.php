<?php
function readJsonFile($file_name) {
    $fh = fopen($file_name, 'r');
    $content = fread($fh, filesize($file_name));
    fclose($fh);
    return $content;
}

$jsonFiles = glob(''."*.*.json");
$json_string = array();
foreach($jsonFiles as $jsonFile) {
    $json = readJsonFile($jsonFile);
    $array = json_decode($json, true);
    $ts = preg_replace('/\d+\.(\d+)\.json/i', "$1", $jsonFile);
    $array['id'] = $ts;
    $array['date'] = date("d/m/Y H:i:s", $ts);
    $json_string[] = json_encode($array);
}

rsort($json_string);
echo "[". implode(',', $json_string) ."]";
