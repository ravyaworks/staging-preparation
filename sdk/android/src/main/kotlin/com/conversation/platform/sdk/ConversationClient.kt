package com.conversation.platform.sdk

import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

class ConversationClient(
    private val baseUrl: String,
    private val apiKey: String,
    private val httpClient: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .build(),
) {
    private val gson = Gson()
    private val jsonMediaType = "application/json".toMediaType()

    private val headers: Map<String, String> = mapOf(
        "Content-Type" to "application/json",
        "Authorization" to "Bearer $apiKey",
    )

    private suspend fun request(
        method: String,
        path: String,
        body: Any? = null,
    ): Map<String, Any?> = withContext(Dispatchers.IO) {
        val url = baseUrl.trimEnd('/') + path
        val jsonBody = body?.let { gson.toJson(it) }
        val request = Request.Builder()
            .url(url)
            .method(method, jsonBody?.toRequestBody(jsonMediaType))
            .apply { headers.forEach { (k, v) -> addHeader(k, v) } }
            .build()

        val response = httpClient.newCall(request).execute()
        val responseBody = gson.fromJson(response.body?.string(), Map::class.java)
            ?: emptyMap<String, Any?>()

        @Suppress("UNCHECKED_CAST")
        val bodyMap = responseBody as Map<String, Any?>

        if (!response.isSuccessful) {
            val error = bodyMap["error"] as? Map<String, Any?>
            throw ConversationPlatformException(
                message = error?.get("message") as? String ?: "Request failed",
                code = error?.get("code") as? String ?: "UNKNOWN_ERROR",
                statusCode = response.code,
            )
        }

        bodyMap
    }

    suspend fun listConversations(
        page: Int? = null,
        limit: Int? = null,
        status: String? = null,
        channelId: String? = null,
    ): List<Conversation> {
        val params = mutableListOf<String>()
        page?.let { params.add("page=$it") }
        limit?.let { params.add("limit=$it") }
        status?.let { params.add("status=$it") }
        channelId?.let { params.add("channelId=$it") }
        val qs = if (params.isNotEmpty()) "?${params.joinToString("&")}" else ""

        val json = request("GET", "/conversations$qs")
        @Suppress("UNCHECKED_CAST")
        val data = json["data"] as? Map<String, Any?> ?: emptyMap()
        @Suppress("UNCHECKED_CAST")
        val items = data["items"] as? List<Map<String, Any?>> ?: emptyList()
        return items.map { Conversation.fromJson(it) }
    }

    suspend fun getConversation(id: String): Conversation {
        val json = request("GET", "/conversations/$id")
        @Suppress("UNCHECKED_CAST")
        val data = json["data"] as? Map<String, Any?> ?: emptyMap()
        return Conversation.fromJson(data)
    }

    suspend fun createConversation(
        channelId: String,
        participantId: String? = null,
        metadata: Map<String, Any?>? = null,
    ): Conversation {
        val body = mutableMapOf<String, Any?>("channelId" to channelId)
        participantId?.let { body["participantId"] = it }
        metadata?.let { body["metadata"] = it }

        val json = request("POST", "/conversations", body)
        @Suppress("UNCHECKED_CAST")
        val data = json["data"] as? Map<String, Any?> ?: emptyMap()
        return Conversation.fromJson(data)
    }

    suspend fun listChannels(): List<Channel> {
        val json = request("GET", "/channels")
        @Suppress("UNCHECKED_CAST")
        val data = json["data"] as? List<Map<String, Any?>> ?: emptyList()
        return data.map { Channel.fromJson(it) }
    }

    suspend fun connectChannel(type: String, config: Map<String, Any?>): Channel {
        val json = request("POST", "/channels", mapOf("type" to type, "config" to config))
        @Suppress("UNCHECKED_CAST")
        val data = json["data"] as? Map<String, Any?> ?: emptyMap()
        return Channel.fromJson(data)
    }

    suspend fun disconnectChannel(type: String) {
        request("POST", "/channels/$type/disconnect")
    }

    suspend fun searchKnowledge(query: String): KnowledgeQueryResult {
        val json = request("POST", "/knowledge/search", mapOf("query" to query))
        @Suppress("UNCHECKED_CAST")
        val data = json["data"] as? Map<String, Any?> ?: emptyMap()
        return KnowledgeQueryResult.fromJson(data)
    }
}
