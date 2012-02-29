<?php
function readJsonFile($file_name) {
    $fh = fopen($file_name, 'r');
    $content = fread($fh, filesize($file_name));
    fclose($fh);
    return $content;
}

$jsonFiles = glob(''."*.*.json");
$json_string = array();

$now = time();
foreach($jsonFiles as $jsonFile) {
    $json = readJsonFile($jsonFile);
    $array = json_decode($json, true);
    $ts = preg_replace('/\d+\.(\d+)\.json/i', "$1", $jsonFile);
    $array['id'] = $ts;
    $second = $now - $ts;
    $array['date'] =  $second . ' second';
    if ($second > 1) {
        $array['date'] .= 's';
    }
    $json_string[$ts] = json_encode($array);
}

krsort($json_string);
array_shift($json_string);
echo "[". implode(',', $json_string) ."]";
