class ConversationPlatformException implements Exception {
  final String message;
  final String code;
  final int statusCode;

  ConversationPlatformException({
    required this.message,
    required this.code,
    this.statusCode = 0,
  });

  @override
  String toString() => 'ConversationPlatformException($code): $message';

  factory ConversationPlatformException.fromResponse(
    int statusCode,
    Map<String, dynamic> body,
  ) {
    final error = body['error'] as Map<String, dynamic>?;
    return ConversationPlatformException(
      message: error?['message'] as String? ?? 'Request failed',
      code: error?['code'] as String? ?? 'UNKNOWN_ERROR',
      statusCode: statusCode,
    );
  }
}
