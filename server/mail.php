<?php
    date_default_timezone_set('Europe/Paris');
    $date = date('d.m.Y \a\t H:i:s');
    if(mail($_POST['email'], 'Notes du '.$date, $_POST['notes'], 'From: BalloonNotes@remygazelot.fr')){
        echo 'success';
    };
?>