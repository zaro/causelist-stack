<?php

	$curl = curl_init();
	curl_setopt_array($curl, array(
		CURLOPT_URL => "https://portal.zettatel.com/SMSApi/send",
		CURLOPT_RETURNTRANSFER => true,
		CURLOPT_ENCODING => "",
		CURLOPT_MAXREDIRS => 10,
		CURLOPT_TIMEOUT => 30,
		CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
		CURLOPT_CUSTOMREQUEST => "POST",
		CURLOPT_POSTFIELDS => "userid=zaro&sendMethod=quick&mobile=254768628673&msg=Hello+World&senderid=ZTSMS&msgType=text&duplicatecheck=true&output=json",
		CURLOPT_HTTPHEADER => array(
			"apikey: c2395debd6724a0bf871de8d904861e10bf304f4",
			"cache-control: no-cache",
			"content-type: application/x-www-form-urlencoded"
		),
	));

	$response = curl_exec($curl);
	$err = curl_error($curl);

	curl_close($curl);

	if ($err) {
		echo "cURL Error #:" . $err;
	} else {
		echo $response;
	}
