-- Adiciona novos valores ao enum faixa_etaria
alter type faixa_etaria add value if not exists '0_18' before '18_25';
alter type faixa_etaria add value if not exists '45_mais' after '36_45';
