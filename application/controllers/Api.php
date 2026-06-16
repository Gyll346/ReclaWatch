<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Api extends CI_Controller {

    public function __construct() {
        parent::__construct();
        
        // CORS Headers
        header('Access-Control-Allow-Origin: *');
        header('Access-Control-Allow-Headers: Content-Type, Authorization');
        header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
        
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            exit(0);
        }
        
        // Load helpers
        $this->load->helper(['jwt', 'exif', 'url']);
    }

    // --- Helper Utilities ---

    private function get_json_input() {
        $raw = file_get_contents('php://input');
        return json_decode($raw, true) ?: [];
    }

    private function response($data, $status = 200) {
        $this->output
             ->set_status_header($status)
             ->set_content_type('application/json', 'utf-8')
             ->set_output(json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES))
             ->_display();
        exit;
    }

    private function get_auth_user() {
        $headers = $this->input->get_request_header('Authorization');
        if (!$headers) {
            $headers = isset($_SERVER['HTTP_AUTHORIZATION']) ? $_SERVER['HTTP_AUTHORIZATION'] : '';
        }
        
        if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
            $token = $matches[1];
            $payload = jwt_decode($token);
            if ($payload && isset($payload['id']) && isset($payload['role'])) {
                return $payload;
            }
        }
        $this->response(['error' => 'Unauthorized access'], 401);
    }

    private function check_role($allowed_roles) {
        $user = $this->get_auth_user();
        if (!in_array($user['role'], $allowed_roles)) {
            $this->response(['error' => 'Forbidden access for your role'], 403);
        }
        return $user;
    }

    private function log_activity($user_id, $action, $details) {
        $this->db->insert('audit_logs', [
            'user_id' => $user_id,
            'action' => $action,
            'details' => $details
        ]);
    }

    // --- 1. Authentication Endpoints ---

    public function login() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->response(['error' => 'Method not allowed'], 405);
        }
        
        $input = $this->get_json_input();
        $username = isset($input['username']) ? trim($input['username']) : '';
        $password = isset($input['password']) ? trim($input['password']) : '';
        
        if (empty($username) || empty($password)) {
            $this->response(['error' => 'Username and password are required'], 400);
        }
        
        $query = $this->db->get_where('users', ['username' => $username]);
        $user = $query->row();
        
        if (!$user || !password_verify($password, $user->password)) {
            $this->response(['error' => 'Invalid username or password'], 401);
        }
        
        $payload = [
            'id' => $user->id,
            'username' => $user->username,
            'role' => $user->role,
            'iat' => time(),
            'exp' => time() + (86400 * 7) // 7 days expiration
        ];
        
        $token = jwt_encode($payload);
        
        $this->log_activity($user->id, 'Login', 'User logged in successfully');
        
        $this->response([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'username' => $user->username,
                'role' => $user->role
            ]
        ]);
    }

    public function validate_token() {
        $user = $this->get_auth_user();
        $this->response(['valid' => true, 'user' => $user]);
    }

    // --- 2. Admin Endpoints ---

    // User CRUD
    public function users($id = null) {
        $currentUser = $this->check_role(['admin']);
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'GET') {
            $this->db->select('id, username, role, created_at');
            $query = $this->db->get('users');
            $this->response($query->result());
        } 
        elseif ($method === 'POST') {
            $input = $this->get_json_input();
            $username = isset($input['username']) ? trim($input['username']) : '';
            $password = isset($input['password']) ? trim($input['password']) : '';
            $role = isset($input['role']) ? trim($input['role']) : '';
            
            if (empty($username) || empty($password) || empty($role)) {
                $this->response(['error' => 'Username, password, and role are required'], 400);
            }
            
            if (!in_array($role, ['admin', 'surveyor', 'auditor'])) {
                $this->response(['error' => 'Invalid role specified'], 400);
            }
            
            // Check username uniqueness
            $check = $this->db->get_where('users', ['username' => $username])->row();
            if ($check) {
                $this->response(['error' => 'Username already exists'], 400);
            }
            
            $insert_data = [
                'username' => $username,
                'password' => password_hash($password, PASSWORD_DEFAULT),
                'role' => $role
            ];
            
            if ($this->db->insert('users', $insert_data)) {
                $new_id = $this->db->insert_id();
                $this->log_activity($currentUser['id'], 'Create User', "Created user {$username} with role {$role}");
                $this->response(['message' => 'User created successfully', 'id' => $new_id]);
            } else {
                $this->response(['error' => 'Failed to create user'], 500);
            }
        } 
        elseif ($method === 'PUT' && $id !== null) {
            $input = $this->get_json_input();
            $username = isset($input['username']) ? trim($input['username']) : '';
            $password = isset($input['password']) ? trim($input['password']) : '';
            $role = isset($input['role']) ? trim($input['role']) : '';
            
            // Fetch existing
            $user = $this->db->get_where('users', ['id' => $id])->row();
            if (!$user) {
                $this->response(['error' => 'User not found'], 404);
            }
            
            $update_data = [];
            if (!empty($username)) {
                // Check username uniqueness
                $check = $this->db->query("SELECT id FROM users WHERE username = ? AND id != ?", [$username, $id])->row();
                if ($check) {
                    $this->response(['error' => 'Username already exists'], 400);
                }
                $update_data['username'] = $username;
            }
            if (!empty($password)) {
                $update_data['password'] = password_hash($password, PASSWORD_DEFAULT);
            }
            if (!empty($role)) {
                if (!in_array($role, ['admin', 'surveyor', 'auditor'])) {
                    $this->response(['error' => 'Invalid role specified'], 400);
                }
                $update_data['role'] = $role;
            }
            
            if (empty($update_data)) {
                $this->response(['message' => 'No changes made']);
            }
            
            $this->db->where('id', $id);
            if ($this->db->update('users', $update_data)) {
                $this->log_activity($currentUser['id'], 'Update User', "Updated user details for ID {$id}");
                $this->response(['message' => 'User updated successfully']);
            } else {
                $this->response(['error' => 'Failed to update user'], 500);
            }
        } 
        elseif ($method === 'DELETE' && $id !== null) {
            if ($id == $currentUser['id']) {
                $this->response(['error' => 'You cannot delete yourself'], 400);
            }
            
            $user = $this->db->get_where('users', ['id' => $id])->row();
            if (!$user) {
                $this->response(['error' => 'User not found'], 404);
            }
            
            $this->db->where('id', $id);
            if ($this->db->delete('users')) {
                $this->log_activity($currentUser['id'], 'Delete User', "Deleted user {$user->username}");
                $this->response(['message' => 'User deleted successfully']);
            } else {
                $this->response(['error' => 'Failed to delete user'], 500);
            }
        } else {
            $this->response(['error' => 'Method not allowed'], 405);
        }
    }

    // Lahan (Spatial Area) CRUD
    public function lahan($id = null) {
        $currentUser = $this->check_role(['admin', 'auditor']); // Auditors can view lahan, Admin does CRUD
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'GET') {
            $sql = "SELECT id, nama_blok, target_luas, ST_AsGeoJSON(geom) AS geojson, geojson_str, created_at FROM lahan";
            $query = $this->db->query($sql);
            $result = $query->result();
            
            // Clean/parse JSON before returning
            foreach ($result as &$row) {
                $row->geojson = json_decode($row->geojson, true);
            }
            
            $this->response($result);
        } 
        elseif ($method === 'POST') {
            $this->check_role(['admin']); // Only admin can create
            $input = $this->get_json_input();
            $nama_blok = isset($input['nama_blok']) ? trim($input['nama_blok']) : '';
            $target_luas = isset($input['target_luas']) ? (float)$input['target_luas'] : 0.0;
            $geojson_val = isset($input['geojson']) ? $input['geojson'] : null; // Can be array or string
            
            if (empty($nama_blok) || $target_luas <= 0 || empty($geojson_val)) {
                $this->response(['error' => 'nama_blok, target_luas, and valid geojson are required'], 400);
            }
            
            $geojson_str = is_array($geojson_val) ? json_encode($geojson_val) : $geojson_val;
            $geojson_arr = json_decode($geojson_str, true);
            
            if (!$geojson_arr || !isset($geojson_arr['geometry']['coordinates'])) {
                $this->response(['error' => 'Invalid GeoJSON Polygon format'], 400);
            }
            
            // Convert GeoJSON geometry to WKT (Well-Known Text) for database insert
            $geom_type = strtoupper($geojson_arr['geometry']['type']);
            if ($geom_type !== 'POLYGON') {
                $this->response(['error' => 'Only POLYGON GeoJSON geometry is supported'], 400);
            }
            
            $coords = $geojson_arr['geometry']['coordinates'][0];
            $wkt_points = [];
            foreach ($coords as $coord) {
                $wkt_points[] = $coord[0] . ' ' . $coord[1]; // Longitude Latitude
            }
            // Ensure closed polygon
            if ($coords[0][0] !== end($coords)[0] || $coords[0][1] !== end($coords)[1]) {
                $wkt_points[] = $coords[0][0] . ' ' . $coords[0][1];
            }
            $wkt = 'POLYGON((' . implode(',', $wkt_points) . '))';
            
            $sql = "INSERT INTO lahan (nama_blok, target_luas, geom, geojson_str) VALUES (?, ?, ST_GeomFromText(?), ?)";
            $success = $this->db->query($sql, [$nama_blok, $target_luas, $wkt, $geojson_str]);
            
            if ($success) {
                $new_id = $this->db->insert_id();
                $this->log_activity($currentUser['id'], 'Create Lahan', "Created Lahan Blok {$nama_blok} with target {$target_luas} Ha");
                $this->response(['message' => 'Lahan created successfully', 'id' => $new_id]);
            } else {
                $this->response(['error' => 'Failed to save spatial data to database'], 500);
            }
        } 
        elseif ($method === 'DELETE' && $id !== null) {
            $this->check_role(['admin']); // Only admin can delete
            
            $lahan = $this->db->get_where('lahan', ['id' => $id])->row();
            if (!$lahan) {
                $this->response(['error' => 'Lahan not found'], 404);
            }
            
            $this->db->where('id', $id);
            if ($this->db->delete('lahan')) {
                $this->log_activity($currentUser['id'], 'Delete Lahan', "Deleted Lahan Blok {$lahan->nama_blok}");
                $this->response(['message' => 'Lahan deleted successfully']);
            } else {
                $this->response(['error' => 'Failed to delete Lahan'], 500);
            }
        } else {
            $this->response(['error' => 'Method not allowed'], 405);
        }
    }

    // Surveyor Assignments CRUD
    public function assignments($id = null) {
        $currentUser = $this->check_role(['admin']);
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'GET') {
            $sql = "SELECT sa.id, sa.surveyor_id, sa.lahan_id, sa.assigned_at, 
                           u.username AS surveyor_name, l.nama_blok AS nama_lahan, l.target_luas
                    FROM surveyor_assignments sa
                    JOIN users u ON sa.surveyor_id = u.id
                    JOIN lahan l ON sa.lahan_id = l.id
                    ORDER BY sa.assigned_at DESC";
            $query = $this->db->query($sql);
            $this->response($query->result());
        } 
        elseif ($method === 'POST') {
            $input = $this->get_json_input();
            $surveyor_id = isset($input['surveyor_id']) ? (int)$input['surveyor_id'] : 0;
            $lahan_id = isset($input['lahan_id']) ? (int)$input['lahan_id'] : 0;
            
            if ($surveyor_id <= 0 || $lahan_id <= 0) {
                $this->response(['error' => 'surveyor_id and lahan_id are required'], 400);
            }
            
            // Validate user is indeed a surveyor
            $user = $this->db->get_where('users', ['id' => $surveyor_id, 'role' => 'surveyor'])->row();
            if (!$user) {
                $this->response(['error' => 'Assigned user must exist and have the surveyor role'], 400);
            }
            
            // Validate lahan exists
            $lahan = $this->db->get_where('lahan', ['id' => $lahan_id])->row();
            if (!$lahan) {
                $this->response(['error' => 'Lahan block not found'], 400);
            }
            
            // Prevent duplicate assignments
            $check = $this->db->get_where('surveyor_assignments', ['surveyor_id' => $surveyor_id, 'lahan_id' => $lahan_id])->row();
            if ($check) {
                $this->response(['error' => 'Surveyor is already assigned to this block'], 400);
            }
            
            $insert_data = [
                'surveyor_id' => $surveyor_id,
                'lahan_id' => $lahan_id
            ];
            
            if ($this->db->insert('surveyor_assignments', $insert_data)) {
                $new_id = $this->db->insert_id();
                $this->log_activity($currentUser['id'], 'Assign Task', "Assigned surveyor {$user->username} to lahan {$lahan->nama_blok}");
                $this->response(['message' => 'Assignment created successfully', 'id' => $new_id]);
            } else {
                $this->response(['error' => 'Failed to create assignment'], 500);
            }
        } 
        elseif ($method === 'DELETE' && $id !== null) {
            $assignment = $this->db->get_where('surveyor_assignments', ['id' => $id])->row();
            if (!$assignment) {
                $this->response(['error' => 'Assignment not found'], 404);
            }
            
            $this->db->where('id', $id);
            if ($this->db->delete('surveyor_assignments')) {
                $this->log_activity($currentUser['id'], 'Delete Assignment', "Removed assignment ID {$id}");
                $this->response(['message' => 'Assignment deleted successfully']);
            } else {
                $this->response(['error' => 'Failed to delete assignment'], 500);
            }
        } else {
            $this->response(['error' => 'Method not allowed'], 405);
        }
    }

    // Settings / SLA CRUD
    public function settings() {
        $currentUser = $this->check_role(['admin', 'auditor']);
        $method = $_SERVER['REQUEST_METHOD'];
        
        if ($method === 'GET') {
            $query = $this->db->get('settings');
            $settings = [];
            foreach ($query->result() as $row) {
                $settings[$row->key] = $row->value;
            }
            $this->response($settings);
        } 
        elseif ($method === 'POST') {
            $this->check_role(['admin']); // Only admin can update settings
            $input = $this->get_json_input();
            
            foreach ($input as $key => $value) {
                $this->db->where('key', $key);
                $query = $this->db->get('settings');
                if ($query->num_rows() > 0) {
                    $this->db->where('key', $key);
                    $this->db->update('settings', ['value' => (string)$value]);
                } else {
                    $this->db->insert('settings', ['key' => $key, 'value' => (string)$value]);
                }
            }
            
            $this->log_activity($currentUser['id'], 'Update Settings', 'Updated system configurations');
            $this->response(['message' => 'Settings updated successfully']);
        } else {
            $this->response(['error' => 'Method not allowed'], 405);
        }
    }


    // --- 3. Surveyor Endpoints ---

    // Surveyor tasks list
    public function surveyor_tasks() {
        $currentUser = $this->check_role(['surveyor']);
        
        // Fetch SLA setting
        $sla_query = $this->db->get_where('settings', ['key' => 'sla_days'])->row();
        $sla_days = $sla_query ? (int)$sla_query->value : 7;
        
        // Query tasks
        $sql = "SELECT sa.id AS assignment_id, sa.assigned_at, l.id AS lahan_id, l.nama_blok, l.target_luas,
                       (SELECT COALESCE(SUM(luas_realisasi), 0) FROM laporan WHERE lahan_id = l.id AND status = 'Approved') AS total_realisasi
                FROM surveyor_assignments sa
                JOIN lahan l ON sa.lahan_id = l.id
                WHERE sa.surveyor_id = ?
                ORDER BY sa.assigned_at DESC";
        
        $query = $this->db->query($sql, [$currentUser['id']]);
        $tasks = $query->result();
        
        foreach ($tasks as &$task) {
            $task->progress_percentage = $task->target_luas > 0 ? ($task->total_realisasi / $task->target_luas) * 100 : 0;
            
            // Calculate SLA warning
            $assigned_time = strtotime($task->assigned_at);
            $deadline_time = $assigned_time + ($sla_days * 86400);
            $task->deadline = date('Y-m-d H:i:s', $deadline_time);
            
            // Warn if past deadline and progress is not yet 100%
            $task->sla_warning = (time() > $deadline_time) && ($task->progress_percentage < 100.0);
        }
        
        $this->response($tasks);
    }

    // Submit report with image and EXIF extraction
    public function surveyor_report() {
        $currentUser = $this->check_role(['surveyor']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->response(['error' => 'Method not allowed'], 405);
        }
        
        $lahan_id = (int)$this->input->post('lahan_id');
        $tahapan = $this->input->post('tahapan');
        $luas_realisasi = (float)$this->input->post('luas_realisasi');
        
        // Optional client coordinates as backup
        $client_lat = $this->input->post('latitude') ? (float)$this->input->post('latitude') : null;
        $client_lng = $this->input->post('longitude') ? (float)$this->input->post('longitude') : null;

        if ($lahan_id <= 0 || empty($tahapan) || $luas_realisasi <= 0) {
            $this->response(['error' => 'lahan_id, tahapan, and positive luas_realisasi are required'], 400);
        }

        if (!in_array($tahapan, ['Penataan Lahan', 'Penyebaran Tanah Pucuk', 'Pengendalian Erosi', 'Revegetasi'])) {
            $this->response(['error' => 'Invalid tahapan specified'], 400);
        }
        
        // Validate surveyor is assigned to this lahan
        $assigned = $this->db->get_where('surveyor_assignments', [
            'surveyor_id' => $currentUser['id'],
            'lahan_id' => $lahan_id
        ])->row();
        
        if (!$assigned) {
            $this->response(['error' => 'You are not assigned to this lahan block'], 403);
        }

        // Image upload
        if (!isset($_FILES['foto']) || $_FILES['foto']['error'] !== UPLOAD_ERR_OK) {
            $this->response(['error' => 'Valid photo is required as reporting evidence'], 400);
        }

        $config['upload_path']   = './uploads/';
        $config['allowed_types'] = 'jpg|jpeg'; // EXIF data is mainly on jpeg
        $config['max_size']      = 10240; // 10MB limit
        $config['encrypt_name']  = TRUE;
        
        $this->load->library('upload', $config);
        
        if (!$this->upload->do_upload('foto')) {
            $this->response(['error' => 'Failed to upload photo: ' . $this->upload->display_errors('', '')], 400);
        }
        
        $upload_data = $this->upload->data();
        $file_name = $upload_data['file_name'];
        $full_path = $upload_data['full_path'];
        $foto_url = 'uploads/' . $file_name;
        
        // Run EXIF extraction
        $gps_data = get_image_gps($full_path);
        
        $latitude = null;
        $longitude = null;
        $geotag_time = date('Y-m-d H:i:s');
        $verification_details = '';
        
        if ($gps_data) {
            $latitude = $gps_data['latitude'];
            $longitude = $gps_data['longitude'];
            $geotag_time = $gps_data['timestamp'];
            $verification_details = 'EXIF Geotag Verified';
        } else {
            // Backup geolocation from frontend
            if ($client_lat !== null && $client_lng !== null) {
                $latitude = $client_lat;
                $longitude = $client_lng;
                $verification_details = 'EXIF data missing. Used Device GPS fallback.';
            } else {
                // Remove the file if no coordinates can be acquired
                @unlink($full_path);
                $this->response(['error' => 'Photo does not contain GPS coordinates, and no browser GPS fallback was provided.'], 400);
            }
        }
        
        $insert_data = [
            'lahan_id' => $lahan_id,
            'surveyor_id' => $currentUser['id'],
            'tahapan' => $tahapan,
            'luas_realisasi' => $luas_realisasi,
            'foto_url' => $foto_url,
            'latitude' => $latitude,
            'longitude' => $longitude,
            'geotag_timestamp' => $geotag_time,
            'status' => 'Pending',
            'catatan_auditor' => $verification_details
        ];
        
        if ($this->db->insert('laporan', $insert_data)) {
            $report_id = $this->db->insert_id();
            $this->log_activity($currentUser['id'], 'Submit Report', "Submitted report for Lahan ID {$lahan_id}, Stage: {$tahapan}, Area: {$luas_realisasi} Ha");
            
            $this->response([
                'message' => 'Report submitted successfully for validation',
                'report_id' => $report_id,
                'geotag' => [
                    'latitude' => $latitude,
                    'longitude' => $longitude,
                    'timestamp' => $geotag_time,
                    'status' => $gps_data ? 'Verified from Exif' : 'Manual Device Fallback'
                ]
            ]);
        } else {
            @unlink($full_path);
            $this->response(['error' => 'Failed to save report to database'], 500);
        }
    }

    // Surveyor report history
    public function surveyor_history() {
        $currentUser = $this->check_role(['surveyor']);
        
        $sql = "SELECT lp.id, lp.lahan_id, lp.tahapan, lp.luas_realisasi, lp.foto_url,
                       lp.latitude, lp.longitude, lp.geotag_timestamp, lp.status, 
                       lp.catatan_auditor, lp.created_at, l.nama_blok AS nama_lahan
                FROM laporan lp
                JOIN lahan l ON lp.lahan_id = l.id
                WHERE lp.surveyor_id = ?
                ORDER BY lp.created_at DESC";
        $query = $this->db->query($sql, [$currentUser['id']]);
        
        $this->response($query->result());
    }


    // --- 4. Auditor & Management Endpoints ---

    // List pending reports
    public function auditor_pending() {
        $this->check_role(['auditor', 'admin']);
        
        $sql = "SELECT lp.id, lp.tahapan, lp.luas_realisasi, lp.foto_url,
                       lp.latitude, lp.longitude, lp.geotag_timestamp, lp.status, 
                       lp.catatan_auditor, lp.created_at, 
                       l.nama_blok AS nama_lahan, l.target_luas AS target_lahan,
                       u.username AS surveyor_name
                FROM laporan lp
                JOIN lahan l ON lp.lahan_id = l.id
                JOIN users u ON lp.surveyor_id = u.id
                WHERE lp.status = 'Pending'
                ORDER BY lp.created_at ASC";
        $query = $this->db->query($sql);
        $this->response($query->result());
    }

    // Validate (Approve/Reject) report
    public function auditor_validate() {
        $currentUser = $this->check_role(['auditor', 'admin']);
        
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            $this->response(['error' => 'Method not allowed'], 405);
        }
        
        $input = $this->get_json_input();
        $laporan_id = isset($input['laporan_id']) ? (int)$input['laporan_id'] : 0;
        $action = isset($input['action']) ? trim($input['action']) : ''; // 'Approved' or 'Rejected'
        $catatan = isset($input['catatan_auditor']) ? trim($input['catatan_auditor']) : '';
        
        if ($laporan_id <= 0 || !in_array($action, ['Approved', 'Rejected'])) {
            $this->response(['error' => 'laporan_id and valid action (Approved/Rejected) are required'], 400);
        }
        
        $laporan = $this->db->get_where('laporan', ['id' => $laporan_id])->row();
        if (!$laporan) {
            $this->response(['error' => 'Report not found'], 404);
        }
        
        if ($laporan->status !== 'Pending') {
            $this->response(['error' => 'Report has already been processed'], 400);
        }
        
        $update_data = [
            'status' => $action,
            'catatan_auditor' => $catatan
        ];
        
        $this->db->where('id', $laporan_id);
        if ($this->db->update('laporan', $update_data)) {
            
            // Recalculate progress for logs
            $lahan = $this->db->get_where('lahan', ['id' => $laporan->lahan_id])->row();
            
            $progress_sql = "SELECT COALESCE(SUM(luas_realisasi), 0) AS total_realisasi FROM laporan WHERE lahan_id = ? AND status = 'Approved'";
            $progress_query = $this->db->query($progress_sql, [$laporan->lahan_id]);
            $total_realisasi = (float)$progress_query->row()->total_realisasi;
            
            $target = (float)$lahan->target_luas;
            $percentage = $target > 0 ? ($total_realisasi / $target) * 100 : 0;
            
            $log_message = "Validated Report ID {$laporan_id}: {$action}. Block: {$lahan->nama_blok}. New overall block progress: " . number_format($percentage, 2) . "% ({$total_realisasi}/{$target} Ha)";
            $this->log_activity($currentUser['id'], $action . ' Report', $log_message);
            
            $this->response([
                'message' => 'Report successfully validated',
                'status' => $action,
                'progress' => [
                    'nama_blok' => $lahan->nama_blok,
                    'total_realisasi' => $total_realisasi,
                    'target_luas' => $target,
                    'percentage' => $percentage
                ]
            ]);
        } else {
            $this->response(['error' => 'Failed to validate report'], 500);
        }
    }

    // Auditor Dashboard details (Map, Stats, Charts, Logs)
    public function auditor_dashboard() {
        $this->check_role(['auditor', 'admin']);
        
        // 1. Statistics
        $total_lahan_res = $this->db->query("SELECT COUNT(*) AS count, COALESCE(SUM(target_luas), 0) AS target FROM lahan")->row();
        $total_lahan = (int)$total_lahan_res->count;
        $total_target = (float)$total_lahan_res->target;
        
        $total_realisasi_res = $this->db->query("SELECT COALESCE(SUM(luas_realisasi), 0) AS total FROM laporan WHERE status = 'Approved'")->row();
        $total_realisasi = (float)$total_realisasi_res->total;
        
        $total_pending = (int)$this->db->query("SELECT COUNT(*) AS count FROM laporan WHERE status = 'Pending'")->row()->count;
        $total_surveyors = (int)$this->db->query("SELECT COUNT(*) AS count FROM users WHERE role = 'surveyor'")->row()->count;
        
        $overall_percentage = $total_target > 0 ? ($total_realisasi / $total_target) * 100 : 0;
        
        // 2. Spatial Map Data (WebGIS)
        // Polygons color logic:
        // Red: Progress 0% (no approved reports) or no reports at all.
        // Yellow: Progress > 0% and < 100%
        // Green: Progress >= 100%
        $lahan_sql = "SELECT id, nama_blok, target_luas, ST_AsGeoJSON(geom) AS geojson,
                            (SELECT COALESCE(SUM(luas_realisasi), 0) FROM laporan WHERE lahan_id = lahan.id AND status = 'Approved') AS total_realisasi
                     FROM lahan";
        $lahan_query = $this->db->query($lahan_sql);
        $lahan_list = $lahan_query->result();
        
        foreach ($lahan_list as &$l) {
            $l->geojson = json_decode($l->geojson, true);
            $l->total_realisasi = (float)$l->total_realisasi;
            $l->target_luas = (float)$l->target_luas;
            
            $progress = $l->target_luas > 0 ? ($l->total_realisasi / $l->target_luas) * 100 : 0;
            $l->progress_percentage = $progress;
            
            // Map Color Code
            if ($progress >= 100.0) {
                $l->status_color = 'green'; // Fully completed
            } elseif ($progress > 0.0) {
                $l->status_color = 'yellow'; // In progress
            } else {
                $l->status_color = 'red'; // No progress / Pending
            }
        }
        
        // 3. Audit trail logs (latest 50)
        $logs_sql = "SELECT al.id, al.action, al.details, al.created_at, u.username 
                     FROM audit_logs al
                     JOIN users u ON al.user_id = u.id
                     ORDER BY al.created_at DESC
                     LIMIT 50";
        $logs_query = $this->db->query($logs_sql);
        $logs = $logs_query->result();
        
        // 4. Grouped Progress by Stage for global overview
        $stages_sql = "SELECT tahapan, COALESCE(SUM(luas_realisasi), 0) AS total_luas 
                       FROM laporan 
                       WHERE status = 'Approved' 
                       GROUP BY tahapan";
        $stages_query = $this->db->query($stages_sql);
        $stages_progress = $stages_query->result();

        $this->response([
            'stats' => [
                'total_lahan' => $total_lahan,
                'total_target' => $total_target,
                'total_realisasi' => $total_realisasi,
                'overall_percentage' => $overall_percentage,
                'total_pending' => $total_pending,
                'total_surveyors' => $total_surveyors
            ],
            'lahan_map' => $lahan_list,
            'audit_logs' => $logs,
            'stages_progress' => $stages_progress
        ]);
    }

    // Export report data as print-ready structures
    public function export_report() {
        $this->check_role(['auditor', 'admin']);
        
        // Summary data
        $lahan_sql = "SELECT l.id, l.nama_blok, l.target_luas,
                            (SELECT COALESCE(SUM(luas_realisasi), 0) FROM laporan WHERE lahan_id = l.id AND status = 'Approved') AS total_realisasi
                     FROM lahan l";
        $lahan_query = $this->db->query($lahan_sql);
        $lahan_list = $lahan_query->result();
        
        foreach ($lahan_list as &$l) {
            $l->total_realisasi = (float)$l->total_realisasi;
            $l->target_luas = (float)$l->target_luas;
            $l->progress_percentage = $l->target_luas > 0 ? ($l->total_realisasi / $l->target_luas) * 100 : 0;
        }

        // Fetch all approved reports details
        $reports_sql = "SELECT lp.id, lp.tahapan, lp.luas_realisasi, lp.geotag_timestamp, 
                               lp.latitude, lp.longitude, u.username AS surveyor_name, l.nama_blok AS nama_lahan
                        FROM laporan lp
                        JOIN lahan l ON lp.lahan_id = l.id
                        JOIN users u ON lp.surveyor_id = u.id
                        WHERE lp.status = 'Approved'
                        ORDER BY lp.geotag_timestamp DESC";
        $reports_query = $this->db->query($reports_sql);
        
        $this->response([
            'generated_at' => date('Y-m-d H:i:s'),
            'summary' => $lahan_list,
            'detailed_reports' => $reports_query->result()
        ]);
    }
}
