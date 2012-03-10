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
	if($second > 3600){
		$rest = $second % 3600;
		$secondsLeft = $rest % 60;
		
		$second = (intval($second / 3600)) . 'h ' . (intval($rest / 60)) . 'min ' . $secondsLeft .'s';
		$array['date'] =  $second;
	}
	else if($second > 60){
		$rest = $second % 60;
		$second = (intval($second / 60)) . 'min ' . $rest .'s';
		$array['date'] =  $second;
	}
	else{
		$array['date'] =  $second . ' second';
		if ($second > 1) {
			$array['date'] .= 's';
		}
	}
    $json_string[$ts] = json_encode($array);
}

krsort($json_string);
array_shift($json_string);
echo "[". implode(',', $json_string) ."]";