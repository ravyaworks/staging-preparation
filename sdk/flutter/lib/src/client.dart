import 'dart:convert';
import 'package:http/http.dart' as http;
import 'types.dart';
import 'exceptions.dart';

class ConversationClient {
  final String baseUrl;
  final String apiKey;
  final http.Client _http;

  ConversationClient({
    required this.baseUrl,
    required this.apiKey,
    http.Client? httpClient,
  }) : _http = httpClient ?? http.Client() {
    baseUrl.replaceAll(RegExp(r'/+$'), '');
  }

  void dispose() {
    _http.close();
  }

  Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $apiKey',
      };

  Future<Map<String, dynamic>> _request(
    String method,
    String path, {
    Map<String, dynamic>? body,
    Map<String, String>? queryParams,
  }) async {
    final uri = Uri.parse('$baseUrl$path').replace(queryParameters: queryParams);
    final response = await _http.send(
      http.Request(method, uri)
        ..headers.addAll(_headers)
        ..body = body != null ? jsonEncode(body) : '',
    );

    final responseBody = jsonDecode(response.body) as Map<String, dynamic>;

    if (response.statusCode >= 400) {
      throw ConversationPlatformException.fromResponse(
        response.statusCode,
        responseBody,
      );
    }

    return responseBody;
  }

  Future<List<Conversation>> listConversations({
    int? page,
    int? limit,
    String? status,
    String? channelId,
  }) async {
    final params = <String, String>{};
    if (page != null) params['page'] = page.toString();
    if (limit != null) params['limit'] = limit.toString();
    if (status != null) params['status'] = status;
    if (channelId != null) params['channelId'] = channelId;

    final json = await _request('GET', '/conversations', queryParams: params);
    final data = json['data'] as Map<String, dynamic>;
    final paginated = PaginatedResult.fromJson(
      data,
      (m) => Conversation.fromJson(m),
    );
    return paginated.items;
  }

  Future<Conversation> getConversation(String id) async {
    final json = await _request('GET', '/conversations/$id');
    return Conversation.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<Conversation> createConversation({
    required String channelId,
    String? participantId,
    Map<String, dynamic>? metadata,
  }) async {
    final json = await _request('POST', '/conversations', body: {
      'channelId': channelId,
      if (participantId != null) 'participantId': participantId,
      if (metadata != null) 'metadata': metadata,
    });
    return Conversation.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<List<Message>> listMessages(String conversationId, {
    int? page,
    int? limit,
    String? before,
    String? after,
  }) async {
    final params = <String, String>{};
    if (page != null) params['page'] = page.toString();
    if (limit != null) params['limit'] = limit.toString();
    if (before != null) params['before'] = before;
    if (after != null) params['after'] = after;

    final json = await _request(
      'GET',
      '/conversations/$conversationId/messages',
      queryParams: params,
    );
    final data = json['data'] as Map<String, dynamic>;
    final paginated = PaginatedResult.fromJson(
      data,
      (m) => Message.fromJson(m),
    );
    return paginated.items;
  }

  Future<Message> sendMessage(
    String conversationId, {
    required String content,
    String? role,
    Map<String, dynamic>? metadata,
  }) async {
    final json = await _request(
      'POST',
      '/conversations/$conversationId/messages',
      body: {
        'content': content,
        if (role != null) 'role': role,
        if (metadata != null) 'metadata': metadata,
      },
    );
    return Message.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<List<Channel>> listChannels() async {
    final json = await _request('GET', '/channels');
    final data = json['data'] as List<dynamic>;
    return data
        .map((e) => Channel.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Channel> connectChannel(
    String type,
    Map<String, dynamic> config,
  ) async {
    final json = await _request('POST', '/channels', body: {
      'type': type,
      'config': config,
    });
    return Channel.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<void> disconnectChannel(String type) async {
    await _request('POST', '/channels/$type/disconnect');
  }

  Future<List<Webhook>> listWebhooks() async {
    final json = await _request('GET', '/webhooks');
    final data = json['data'] as List<dynamic>;
    return data
        .map((e) => Webhook.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<Webhook> createWebhook({
    required String url,
    required List<String> events,
    String? secret,
    bool? enabled,
  }) async {
    final json = await _request('POST', '/webhooks', body: {
      'url': url,
      'events': events,
      if (secret != null) 'secret': secret,
      if (enabled != null) 'enabled': enabled,
    });
    return Webhook.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<void> deleteWebhook(String id) async {
    await _request('DELETE', '/webhooks/$id');
  }

  Future<KnowledgeQueryResult> searchKnowledge(String query) async {
    final json = await _request('POST', '/knowledge/search', body: {
      'query': query,
    });
    return KnowledgeQueryResult.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<List<Document>> listDocuments(String libraryId) async {
    final json = await _request(
      'GET',
      '/knowledge/libraries/$libraryId/documents',
    );
    final data = json['data'] as List<dynamic>;
    return data
        .map((e) => Document.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<Workflow>> listWorkflows() async {
    final json = await _request('GET', '/workflows');
    final data = json['data'] as List<dynamic>;
    return data
        .map((e) => Workflow.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<WorkflowExecution> executeWorkflow(
    String id, {
    Map<String, dynamic>? input,
  }) async {
    final json = await _request('POST', '/workflows/$id/execute', body: {
      if (input != null) 'input': input,
    });
    return WorkflowExecution.fromJson(json['data'] as Map<String, dynamic>);
  }

  Future<AnalyticsResult> queryAnalytics({
    required String metric,
    required List<String> dimensions,
    Map<String, dynamic>? filters,
    required String startDate,
    required String endDate,
    String? interval,
  }) async {
    final json = await _request('POST', '/analytics/query', body: {
      'metric': metric,
      'dimensions': dimensions,
      if (filters != null) 'filters': filters,
      'startDate': startDate,
      'endDate': endDate,
      if (interval != null) 'interval': interval,
    });
    return AnalyticsResult.fromJson(json['data'] as Map<String, dynamic>);
  }
}
