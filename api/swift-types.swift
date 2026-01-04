/**
 * 智慧温室 API Swift 数据模型
 * 供 iOS/macOS 项目使用
 * 配合 Alamofire + Codable 使用
 */

import Foundation

// MARK: - 通用

struct ApiResponse<T: Codable>: Codable {
    let code: Int
    let msg: String
    let data: T?
}

// MARK: - Auth

struct LoginRequest: Codable {
    let username: String
    let password: String
}

struct User: Codable {
    let id: String
    let username: String
    let role: String        // EXPERT, STANDARD, MINIMAL
    let defaultMode: String
    let createdAt: String?
}

struct LoginData: Codable {
    let token: String
    let user: User
}

// MARK: - Device

struct GeoPoint: Codable {
    let type: String
    let coordinates: [Double]  // [lng, lat]
}

enum GreenhouseStatus: String, Codable {
    case normal = "NORMAL"
    case warning = "WARNING"
    case critical = "CRITICAL"
}

enum ZoneStatus: String, Codable {
    case healthy = "HEALTHY"
    case warning = "WARNING"
    case critical = "CRITICAL"
}

enum DeviceType: String, Codable {
    case fan = "FAN"
    case light = "LIGHT"
    case pump = "PUMP"
    case heater = "HEATER"
}

enum ActionType: String, Codable {
    case irrigation = "IRRIGATION"
    case ventilation = "VENTILATION"
    case lighting = "LIGHTING"
    case heating = "HEATING"
}

struct Greenhouse: Codable {
    let id: String
    let name: String
    let crop: String
    let status: String
    let healthScore: Int
    let location: GeoPoint?
    let createdAt: String?
}

struct Zone: Codable {
    let id: String
    let name: String
    let greenhouseId: String
    let cropType: String
    let status: String
}

struct Actuator: Codable {
    let id: String
    let name: String
    let zoneId: String
    let type: String
    let currentValue: String
    let autoMode: Bool
}

struct ZoneWithDevices: Codable {
    let zone: Zone
    let devices: [Actuator]
}

struct GreenhouseDetail: Codable {
    let info: Greenhouse
    let zones: [ZoneWithDevices]
}

struct ControlRequest: Codable {
    let mode: String?
    let action: String
    let duration: Int?
}

// MARK: - Data

struct SensorData: Codable {
    let greenhouseId: String
    let temperature: Double
    let humidity: Double
}

// MARK: - AI

struct Decision: Codable {
    let action: String
    let reason: String
    let confidence: Double
}

enum TaskStatus: String, Codable {
    case pending = "pending"
    case completed = "completed"
    case failed = "failed"
}

struct AiTask: Codable {
    let id: String
    let type: String
    let status: String
    let aiConfidence: Double
}

// MARK: - Vision

struct DiagnosisRequest: Codable {
    let imageUrl: String
}

enum PlantCondition: String, Codable {
    case healthy = "healthy"
    case pest = "pest"
    case disease = "disease"
}

struct Diagnosis: Codable {
    let condition: String
    let disease: String
    let confidence: Double
    let treatment: [String]
}
