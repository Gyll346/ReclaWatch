<?php
defined('BASEPATH') OR exit('No direct script access allowed');

if (!function_exists('base64url_encode')) {
    function base64url_encode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
}

if (!function_exists('base64url_decode')) {
    function base64url_decode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}

if (!function_exists('jwt_encode')) {
    function jwt_encode($payload, $key = 'reclawatch_secret_key_2026') {
        $header = json_encode(['alg' => 'HS256', 'typ' => 'JWT']);
        
        $base64UrlHeader = base64url_encode($header);
        $base64UrlPayload = base64url_encode(json_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, $key, true);
        $base64UrlSignature = base64url_encode($signature);
        
        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }
}

if (!function_exists('jwt_decode')) {
    function jwt_decode($jwt, $key = 'reclawatch_secret_key_2026') {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }
        
        list($header_b64, $payload_b64, $signature_b64) = $parts;
        
        $header = json_decode(base64url_decode($header_b64), true);
        if (!$header || !isset($header['alg']) || $header['alg'] !== 'HS256') {
            return false;
        }
        
        $signature = base64url_decode($signature_b64);
        $expected_signature = hash_hmac('sha256', $header_b64 . "." . $payload_b64, $key, true);
        
        if (!hash_equals($signature, $expected_signature)) {
            return false;
        }
        
        $payload = json_decode(base64url_decode($payload_b64), true);
        if (!$payload) {
            return false;
        }
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false; // Expired
        }
        
        return $payload;
    }
}
