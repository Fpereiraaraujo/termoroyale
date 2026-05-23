package com.fernando.termoroyale.config;

import com.fernando.termoroyale.core.domain.Room;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializer;
// Se estiver usando o Jackson configurado anteriormente:
import com.fasterxml.jackson.databind.ObjectMapper;

@Configuration // CRITICAL: Sem isso o Spring ignora a classe
public class RedisConfig {

    @Bean // CRITICAL: Registra o bean no contexto do Spring
    public RedisTemplate<String, Room> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Room> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        // Use o Serializer que configuramos com o ObjectMapper do Jackson 3
        // (Assumindo que você tem o bean do ObjectMapper ou instanciou aqui)
        template.setKeySerializer(RedisSerializer.string());
        template.setValueSerializer(new GenericJackson2JsonRedisSerializer());

        template.afterPropertiesSet();
        return template;
    }
}