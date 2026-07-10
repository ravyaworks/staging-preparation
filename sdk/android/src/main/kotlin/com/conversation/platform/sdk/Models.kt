package com.conversation.platform.sdk

data class Conversation(
    val id: String,
    val tenantId: String,
    val channelId: String,
    val status: String,
    val metadata: Map<String, Any?>,
    val createdAt: String,
    val updatedAt: String,
) {
    companion object {
        fun fromJson(json: Map<String, Any?>): Conversation = Conversation(
            id = json["id"] as? String ?: "",
            tenantId = json["tenantId"] as? String ?: "",
            channelId = json["channelId"] as? String ?: "",
            status = json["status"] as? String ?: "",
            metadata = (json["metadata"] as? Map<String, Any?>) ?: emptyMap(),
            createdAt = json["createdAt"] as? String ?: "",
            updatedAt = json["updatedAt"] as? String ?: "",
        )
    }
}

data class Message(
    val id: String,
    val conversationId: String,
    val role: String,
    val content: String,
    val metadata: Map<String, Any?>,
    val createdAt: String,
) {
    companion object {
        fun fromJson(json: Map<String, Any?>): Message = Message(
            id = json["id"] as? String ?: "",
            conversationId = json["conversationId"] as? String ?: "",
            role = json["role"] as? String ?: "",
            content = json["content"] as? String ?: "",
            metadata = (json["metadata"] as? Map<String, Any?>) ?: emptyMap(),
            createdAt = json["createdAt"] as? String ?: "",
        )
    }
}

data class Channel(
    val id: String,
    val type: String,
    val name: String,
    val config: Map<String, Any?>,
    val enabled: Boolean,
    val connected: Boolean,
    val createdAt: String,
    val updatedAt: String,
) {
    companion object {
        fun fromJson(json: Map<String, Any?>): Channel = Channel(
            id = json["id"] as? String ?: "",
            type = json["type"] as? String ?: "",
            name = json["name"] as? String ?: "",
            config = (json["config"] as? Map<String, Any?>) ?: emptyMap(),
            enabled = json["enabled"] as? Boolean ?: false,
            connected = json["connected"] as? Boolean ?: false,
            createdAt = json["createdAt"] as? String ?: "",
            updatedAt = json["updatedAt"] as? String ?: "",
        )
    }
}

data class Webhook(
    val id: String,
    val url: String,
    val events: List<String>,
    val secret: String,
    val enabled: Boolean,
    val createdAt: String,
    val updatedAt: String,
) {
    companion object {
        fun fromJson(json: Map<String, Any?>): Webhook = Webhook(
            id = json["id"] as? String ?: "",
            url = json["url"] as? String ?: "",
            events = (json["events"] as? List<*>)?.filterIsInstance<String>() ?: emptyList(),
            secret = json["secret"] as? String ?: "",
            enabled = json["enabled"] as? Boolean ?: false,
            createdAt = json["createdAt"] as? String ?: "",
            updatedAt = json["updatedAt"] as? String ?: "",
        )
    }
}

data class KnowledgeResult(
    val documentId: String,
    val libraryId: String,
    val title: String,
    val snippet: String,
    val score: Double,
    val metadata: Map<String, Any?>,
) {
    companion object {
        fun fromJson(json: Map<String, Any?>): KnowledgeResult = KnowledgeResult(
            documentId = json["documentId"] as? String ?: "",
            libraryId = json["libraryId"] as? String ?: "",
            title = json["title"] as? String ?: "",
            snippet = json["snippet"] as? String ?: "",
            score = (json["score"] as? Number)?.toDouble() ?: 0.0,
            metadata = (json["metadata"] as? Map<String, Any?>) ?: emptyMap(),
        )
    }
}

data class KnowledgeQueryResult(
    val query: String,
    val results: List<KnowledgeResult>,
) {
    companion object {
        fun fromJson(json: Map<String, Any?>): KnowledgeQueryResult = KnowledgeQueryResult(
            query = json["query"] as? String ?: "",
            results = (json["results"] as? List<*>)?.mapNotNull {
                @Suppress("UNCHECKED_CAST")
                (it as? Map<String, Any?>)?.let { m -> KnowledgeResult.fromJson(m) }
            } ?: emptyList(),
        )
    }
}
