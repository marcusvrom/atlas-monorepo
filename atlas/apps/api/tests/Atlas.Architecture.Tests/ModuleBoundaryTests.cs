using System.Reflection;
using FluentAssertions;
using NetArchTest.Rules;
using Xunit;

namespace Atlas.Architecture.Tests;

/// <summary>
/// A fronteira de módulo é mantida por TESTE, não por disciplina.
///
/// Sem isto, o modular monolith degrada previsivelmente para big ball of mud —
/// e aí a promessa de "extrair para microserviço em dias" deixa de valer.
/// Ver ADR-0001 e AGENTS.md R6.
/// </summary>
public sealed class ModuleBoundaryTests
{
    private static readonly Assembly CatalogDomain = typeof(Catalog.Domain.Exercise).Assembly;
    private static readonly Assembly CatalogApplication = typeof(Catalog.Application.ExerciseQuery).Assembly;
    private static readonly Assembly CatalogInfrastructure = typeof(Catalog.Infrastructure.ExerciseReadStore).Assembly;

    private static readonly string[] OtherModuleNamespaces =
    [
        "Atlas.Identity", "Atlas.Programming", "Atlas.Session", "Atlas.BodyMeasurement",
        "Atlas.Marketplace", "Atlas.Coaching", "Atlas.Billing", "Atlas.Insights"
    ];

    [Fact]
    public void Domain_nao_depende_de_infraestrutura()
    {
        var result = Types.InAssembly(CatalogDomain)
            .Should()
            .NotHaveDependencyOnAny("Microsoft.EntityFrameworkCore", "Dapper", "Npgsql", "Microsoft.AspNetCore")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(FormatFailures(result));
    }

    [Fact]
    public void Application_nao_depende_de_infraestrutura_concreta()
    {
        var result = Types.InAssembly(CatalogApplication)
            .Should()
            .NotHaveDependencyOnAny("Dapper", "Npgsql", "Microsoft.AspNetCore")
            .GetResult();

        result.IsSuccessful.Should().BeTrue(FormatFailures(result));
    }

    [Fact]
    public void Modulo_nao_referencia_outro_modulo()
    {
        foreach (var assembly in new[] { CatalogDomain, CatalogApplication, CatalogInfrastructure })
        {
            var result = Types.InAssembly(assembly)
                .Should()
                .NotHaveDependencyOnAny(OtherModuleNamespaces)
                .GetResult();

            result.IsSuccessful.Should().BeTrue(FormatFailures(result));
        }
    }

    [Fact]
    public void Agregados_expoem_colecoes_somente_leitura()
    {
        var mutableCollections = Types.InAssembly(CatalogDomain)
            .That().Inherit(typeof(SharedKernel.Domain.AggregateRoot<>))
            .GetTypes()
            .SelectMany(type => type.GetProperties(BindingFlags.Public | BindingFlags.Instance))
            .Where(property => property.PropertyType.IsGenericType
                && property.PropertyType.GetGenericTypeDefinition() == typeof(List<>))
            .ToList();

        mutableCollections.Should().BeEmpty(
            "expor List<T> permite mutação fora do agregado e quebra as invariantes");
    }

    private static string FormatFailures(TestResult result) =>
        result.FailingTypeNames is null
            ? string.Empty
            : string.Join(", ", result.FailingTypeNames);
}
