<?php
defined('BASEPATH') OR exit('No direct script access allowed');

if (!function_exists('gps_fraction_to_float')) {
    function gps_fraction_to_float($fraction_str) {
        $parts = explode('/', $fraction_str);
        if (count($parts) === 2) {
            $num = (float)$parts[0];
            $den = (float)$parts[1];
            if ($den == 0) {
                return 0;
            }
            return $num / $den;
        }
        return (float)$fraction_str;
    }
}

if (!function_exists('get_image_gps')) {
    function get_image_gps($file_path) {
        if (!file_exists($file_path)) {
            return false;
        }

        // Suppress errors because files without EXIF or non-jpeg files will trigger warnings
        $exif = @exif_read_data($file_path);
        if (!$exif) {
            return false;
        }

        $latitude = null;
        $longitude = null;
        $timestamp = null;

        // Extract GPS coordinates
        if (isset($exif['GPSLatitude']) && isset($exif['GPSLongitude']) && 
            isset($exif['GPSLatitudeRef']) && isset($exif['GPSLongitudeRef'])) {
            
            $lat_deg = gps_fraction_to_float($exif['GPSLatitude'][0]);
            $lat_min = gps_fraction_to_float($exif['GPSLatitude'][1]);
            $lat_sec = gps_fraction_to_float($exif['GPSLatitude'][2]);
            $latitude = $lat_deg + ($lat_min / 60.0) + ($lat_sec / 3600.0);
            if (strtoupper($exif['GPSLatitudeRef']) === 'S') {
                $latitude = -$latitude;
            }

            $lon_deg = gps_fraction_to_float($exif['GPSLongitude'][0]);
            $lon_min = gps_fraction_to_float($exif['GPSLongitude'][1]);
            $lon_sec = gps_fraction_to_float($exif['GPSLongitude'][2]);
            $longitude = $lon_deg + ($lon_min / 60.0) + ($lon_sec / 3600.0);
            if (strtoupper($exif['GPSLongitudeRef']) === 'W') {
                $longitude = -$longitude;
            }
        }

        // Extract Timestamp
        if (isset($exif['DateTimeOriginal'])) {
            // Format is usually YYYY:MM:DD HH:MM:SS, convert to YYYY-MM-DD HH:MM:SS
            $parts = explode(' ', $exif['DateTimeOriginal']);
            if (count($parts) === 2) {
                $date_part = str_replace(':', '-', $parts[0]);
                $timestamp = $date_part . ' ' . $parts[1];
            }
        } elseif (isset($exif['DateTime'])) {
            $parts = explode(' ', $exif['DateTime']);
            if (count($parts) === 2) {
                $date_part = str_replace(':', '-', $parts[0]);
                $timestamp = $date_part . ' ' . $parts[1];
            }
        }

        if ($latitude !== null && $longitude !== null) {
            return [
                'latitude' => $latitude,
                'longitude' => $longitude,
                'timestamp' => $timestamp ? $timestamp : date('Y-m-d H:i:s')
            ];
        }

        return false;
    }
}
