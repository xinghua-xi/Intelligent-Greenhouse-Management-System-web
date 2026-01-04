/**
 * 智慧温室 API Kotlin 数据类
 * 供 Android/Kotlin Multiplatform 项目使用
 * 配合 Retrofit + Moshi/Kotlinx.serialization 使用
 */

package com.smartgreenhouse.api.model

import kotlinx.serialization.Serializable

// ==================== 通用 ====================

@Serializable
data class ApiResponse<T>(
    val code: Int,
    val msg: String,
    val data: T?
)

// ==================== Auth ====================

@Serializable
data class LoginRequest(
    val username: String,
    val password: String
)

@Serializable
data class User(
    val id: String,
    val username: String,
    val role: String,        // EXPERT, STANDARD, MINIMAL
    val defaultMode: String,
    val createdAt: String?
)

@Serializable
data class LoginData(
    val token: String,
    val user: User
)

// ==================== Device ====================

@Serializable
data class GeoPoint(
    val type: String = "Point",
    val coordinates: List<Double>  // [lng, lat]
)

@Serializable
data class Greenhouse(
    val id: String,
    val name: String,
    val crop: String,
    val status: String,      // NORMAL, WARNING, CRITICAL
    val healthScore: Int,
    val location: GeoPoint? = null,
    val createdAt: String?
)

@Serializable
data class Zone(
    val id: String,
    val name: String,
    val greenhouseId: String,
    val cropType: String,
    val status: String       // HEALTHY, WARNING, CRITICAL
)

@Serializable
data class Actuator(
    val id: String,
    val name: String,
    val zoneId: String,
    val type: String,        // FAN, LIGHT, PUMP, HEATER
    val currentValue: String,
    val autoMode: Boolean
)

@Serializable
data class ZoneWithDevices(
    val zone: Zone,
    val devices: List<Actuator>
)

@Serializable
data class GreenhouseDetail(
    val info: Greenhouse,
    val zones: List<ZoneWithDevices>
)

@Serializable
data class ControlRequest(
    val mode: String? = null,
    val action: String,      // IRRIGATION, VENTILATION, LIGHTING, HEATING
    val duration: Int? = null
)

// ==================== Data ====================

@Serializable
data class SensorData(
    val greenhouseId: String,
    val temperature: Double,
    val humidity: Double
)

// ==================== AI ====================

@Serializable
data class Decision(
    val action: String,
    val reason: String,
    val confidence: Double
)

@Serializable
data class AiTask(
    val id: String,
    val type: String,        // irrigation, fertilizer, ventilation
    val status: String,      // pending, completed, failed
    val aiConfidence: Double
)

// ==================== Vision ====================

@Serializable
data class DiagnosisRequest(
    val imageUrl: String
)

@Serializable
data class Diagnosis(
    val condition: String,   // healthy, pest, disease
    val disease: String,
    val confidence: Double,
    val treatment: List<String>
)
