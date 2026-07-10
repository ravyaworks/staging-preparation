class Conversation {
  final String id;
  final String tenantId;
  final String channelId;
  final String status;
  final Map<String, dynamic> metadata;
  final String createdAt;
  final String updatedAt;

  Conversation({
    required this.id,
    required this.tenantId,
    required this.channelId,
    required this.status,
    required this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      id: json['id'] as String,
      tenantId: json['tenantId'] as String,
      channelId: json['channelId'] as String,
      status: json['status'] as String,
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class Message {
  final String id;
  final String conversationId;
  final String role;
  final String content;
  final Map<String, dynamic> metadata;
  final String createdAt;

  Message({
    required this.id,
    required this.conversationId,
    required this.role,
    required this.content,
    required this.metadata,
    required this.createdAt,
  });

  factory Message.fromJson(Map<String, dynamic> json) {
    return Message(
      id: json['id'] as String,
      conversationId: json['conversationId'] as String,
      role: json['role'] as String,
      content: json['content'] as String,
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
      createdAt: json['createdAt'] as String,
    );
  }
}

class Channel {
  final String id;
  final String type;
  final String name;
  final Map<String, dynamic> config;
  final bool enabled;
  final bool connected;
  final String createdAt;
  final String updatedAt;

  Channel({
    required this.id,
    required this.type,
    required this.name,
    required this.config,
    required this.enabled,
    required this.connected,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Channel.fromJson(Map<String, dynamic> json) {
    return Channel(
      id: json['id'] as String,
      type: json['type'] as String,
      name: json['name'] as String,
      config: json['config'] as Map<String, dynamic>? ?? {},
      enabled: json['enabled'] as bool? ?? false,
      connected: json['connected'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class Webhook {
  final String id;
  final String url;
  final List<String> events;
  final String secret;
  final bool enabled;
  final String createdAt;
  final String updatedAt;

  Webhook({
    required this.id,
    required this.url,
    required this.events,
    required this.secret,
    required this.enabled,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Webhook.fromJson(Map<String, dynamic> json) {
    return Webhook(
      id: json['id'] as String,
      url: json['url'] as String,
      events: (json['events'] as List<dynamic>).cast<String>(),
      secret: json['secret'] as String,
      enabled: json['enabled'] as bool? ?? false,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class KnowledgeResult {
  final String documentId;
  final String libraryId;
  final String title;
  final String snippet;
  final double score;
  final Map<String, dynamic> metadata;

  KnowledgeResult({
    required this.documentId,
    required this.libraryId,
    required this.title,
    required this.snippet,
    required this.score,
    required this.metadata,
  });

  factory KnowledgeResult.fromJson(Map<String, dynamic> json) {
    return KnowledgeResult(
      documentId: json['documentId'] as String,
      libraryId: json['libraryId'] as String,
      title: json['title'] as String,
      snippet: json['snippet'] as String,
      score: (json['score'] as num).toDouble(),
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
    );
  }
}

class KnowledgeQueryResult {
  final String query;
  final List<KnowledgeResult> results;

  KnowledgeQueryResult({required this.query, required this.results});

  factory KnowledgeQueryResult.fromJson(Map<String, dynamic> json) {
    return KnowledgeQueryResult(
      query: json['query'] as String,
      results: (json['results'] as List<dynamic>)
          .map((e) => KnowledgeResult.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class Document {
  final String id;
  final String libraryId;
  final String title;
  final String type;
  final String status;
  final Map<String, dynamic> metadata;
  final String createdAt;
  final String updatedAt;

  Document({
    required this.id,
    required this.libraryId,
    required this.title,
    required this.type,
    required this.status,
    required this.metadata,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Document.fromJson(Map<String, dynamic> json) {
    return Document(
      id: json['id'] as String,
      libraryId: json['libraryId'] as String,
      title: json['title'] as String,
      type: json['type'] as String,
      status: json['status'] as String,
      metadata: json['metadata'] as Map<String, dynamic>? ?? {},
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class Workflow {
  final String id;
  final String name;
  final String description;
  final String version;
  final String status;
  final String createdAt;
  final String updatedAt;

  Workflow({
    required this.id,
    required this.name,
    required this.description,
    required this.version,
    required this.status,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Workflow.fromJson(Map<String, dynamic> json) {
    return Workflow(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String,
      version: json['version'] as String,
      status: json['status'] as String,
      createdAt: json['createdAt'] as String,
      updatedAt: json['updatedAt'] as String,
    );
  }
}

class WorkflowExecution {
  final String id;
  final String workflowId;
  final String status;
  final Map<String, dynamic> input;
  final Map<String, dynamic>? output;
  final String? error;
  final String startedAt;
  final String? completedAt;

  WorkflowExecution({
    required this.id,
    required this.workflowId,
    required this.status,
    required this.input,
    this.output,
    this.error,
    required this.startedAt,
    this.completedAt,
  });

  factory WorkflowExecution.fromJson(Map<String, dynamic> json) {
    return WorkflowExecution(
      id: json['id'] as String,
      workflowId: json['workflowId'] as String,
      status: json['status'] as String,
      input: json['input'] as Map<String, dynamic>? ?? {},
      output: json['output'] as Map<String, dynamic>?,
      error: json['error'] as String?,
      startedAt: json['startedAt'] as String,
      completedAt: json['completedAt'] as String?,
    );
  }
}

class AnalyticsResult {
  final String metric;
  final List<Map<String, dynamic>> data;
  final Map<String, dynamic> summary;

  AnalyticsResult({
    required this.metric,
    required this.data,
    required this.summary,
  });

  factory AnalyticsResult.fromJson(Map<String, dynamic> json) {
    return AnalyticsResult(
      metric: json['metric'] as String,
      data: (json['data'] as List<dynamic>)
          .map((e) => e as Map<String, dynamic>)
          .toList(),
      summary: json['summary'] as Map<String, dynamic>? ?? {},
    );
  }
}

class PaginatedResult<T> {
  final List<T> items;
  final int total;
  final int page;
  final int limit;
  final bool hasMore;

  PaginatedResult({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
    required this.hasMore,
  });

  factory PaginatedResult.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromItem,
  ) {
    return PaginatedResult(
      items: (json['items'] as List<dynamic>)
          .map((e) => fromItem(e as Map<String, dynamic>))
          .toList(),
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      limit: json['limit'] as int? ?? 20,
      hasMore: json['hasMore'] as bool? ?? false,
    );
  }
}

class ApiResponse<T> {
  final bool success;
  final T? data;
  final ApiError? error;

  ApiResponse({required this.success, this.data, this.error});

  factory ApiResponse.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>)? fromItem,
  ) {
    return ApiResponse(
      success: json['success'] as bool? ?? false,
      data: json['data'] != null && fromItem != null
          ? fromItem(json['data'] as Map<String, dynamic>)
          : null,
      error: json['error'] != null
          ? ApiError.fromJson(json['error'] as Map<String, dynamic>)
          : null,
    );
  }
}

class ApiError {
  final String message;
  final String code;

  ApiError({required this.message, required this.code});

  factory ApiError.fromJson(Map<String, dynamic> json) {
    return ApiError(
      message: json['message'] as String? ?? 'Unknown error',
      code: json['code'] as String? ?? 'UNKNOWN_ERROR',
    );
  }
}
