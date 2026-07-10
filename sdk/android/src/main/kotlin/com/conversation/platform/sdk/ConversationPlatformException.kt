package com.conversation.platform.sdk

class ConversationPlatformException(
    override val message: String,
    val code: String,
    val statusCode: Int,
) : Exception("$code: $message")
